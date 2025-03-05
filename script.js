// Initialisation de la carte avec Leaflet
var map = L.map('map').setView([43.95, 5.78], 13); // Coordonnées de Forcalquier

// Ajout d'une couche de tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variable pour stocker les données GeoJSON
let geojsonLayer = null;

// Fonction pour charger les données d'une commune
function loadCommuneData() {
    // Récupération des valeurs entrées par l'utilisateur
    const departementCode = document.getElementById('departement').value;
    const communeCode = document.getElementById('commune').value;
    
    // Vérification que les champs ne sont pas vides
    if (!departementCode || !communeCode) {
        console.error('Veuillez entrer un code de département et de commune.');
        return;
    }

    const features = [];
    let startIndex = 0;
    const count = 1000; // Nombre maximum de parcelles à récupérer par requête

    // Fonction récursive pour récupérer toutes les parcelles si elles sont paginées
    function fetchPage(startIndex) {
        // Construction de l'URL de requête vers l'API
        const url = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&TYPENAMES=BDPARCELLAIRE-VECTEUR_WLD_BDD_WGS84G:parcelle&REQUEST=getFeature&VERSION=2.0.0&OUTPUTFORMAT=application/json&cql_filter=code_dep='${departementCode}' AND code_com='${communeCode}'&startIndex=${startIndex}&count=${count}`;
        

        // Envoi de la requête à l'API
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Problème réseau : ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log('Données reçues ');
                
                // Vérification que des données sont retournées
                if (data.features.length > 0) {
                    features.push(...data.features);
                    // Si la page est pleine, continuer la pagination
                    if (data.features.length === count) {
                        fetchPage(startIndex + count);
                    } else {
                        displayFeatures(features);
                    }
                } else {
                    displayFeatures(features);
                }
            })
            .catch(error => {
                console.error('Problème avec la requête fetch :', error);
            });
    }

    // Fonction pour afficher les parcelles sur la carte
    function displayFeatures(features) {
        
        
        // Supprimer la couche précédente si elle existe
        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }
        
        // Ajouter les nouvelles parcelles à la carte
        geojsonLayer = L.geoJSON({
            type: "FeatureCollection",
            features: features
        }, {
            style: function (feature) {
                return {
                    color: "#ff7800",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.1
                };
            },
            onEachFeature: function (feature, layer) {
                
                if (feature.properties && feature.properties.numero && feature.properties.section) {
                    layer.bindPopup(`Section: ${feature.properties.section}, Numéro: ${feature.properties.numero}`);
                } else {
                    layer.bindPopup("Aucune information disponible");
                }
            }
        }).addTo(map);

        // Ajuster le zoom pour afficher toutes les parcelles chargées
        map.fitBounds(geojsonLayer.getBounds());
    }

    fetchPage(startIndex);
}

// Écouteurs d'événements pour les boutons de chargement
document.getElementById('loadDepartementButton').addEventListener('click', loadCommuneData);
document.getElementById('loadCommuneButton').addEventListener('click', loadCommuneData);

// Fonction pour zoomer sur une parcelle spécifique
function zoomToParcelle() {
    const section = document.getElementById('section').value.toLowerCase();
    const numero = document.getElementById('numero').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = ''; // Réinitialisation du message d'erreur

    console.log('Recherche de la parcelle :', { section, numero });

    let parcelleTrouvee = false;

    if (geojsonLayer) {
        geojsonLayer.eachLayer(function (layer) {
            const properties = layer.feature.properties;
            

            // Comparaison avec les données saisies
            if (properties.section && properties.numero) {
                if (properties.section.toLowerCase() === section && properties.numero === numero) {
                    console.log('Parcelle trouvée :', properties);
                    map.fitBounds(layer.getBounds());
                    layer.setStyle({ color: 'blue', fillOpacity: 0.3 });
                    parcelleTrouvee = true;
                } else {
                    layer.setStyle({ color: '#ff7800', fillOpacity: 0.1 });
                }
            }
        });
    }

    if (!parcelleTrouvee) {
        errorMessage.textContent = 'Parcelle non trouvée. Veuillez vérifier la section et le numéro.';
    }
}

// Ajout d'un écouteur d'événement pour le bouton de zoom
document.getElementById('zoomButton').addEventListener('click', zoomToParcelle);
