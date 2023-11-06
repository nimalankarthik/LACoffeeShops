import React, { useEffect } from 'react';
import { loadModules } from 'esri-loader'; // This is a library to load ArcGIS modules asynchronously
import './App.css';

function ArcGISMap() {
  useEffect(() => {
    loadModules([
      'esri/config',
      'esri/Map',
      'esri/views/MapView',
      'esri/rest/serviceArea',
      'esri/rest/support/ServiceAreaParameters',
      'esri/rest/support/FeatureSet',
      'esri/Graphic',
      "esri/layers/FeatureLayer",
      "esri/PopupTemplate",
      "esri/rest/places",
      "esri/rest/support/FetchPlaceParameters",
      "esri/rest/support/PlacesQueryParameters",
      "esri/geometry/Circle",
      "esri/layers/GraphicsLayer",
      "esri/symbols/WebStyleSymbol"
    ]).then(([esriConfig, Map, MapView, serviceArea, ServiceAreaParams, FeatureSet, Graphic, FeatureLayer, PopupTemplate, places, FetchPlaceParameters, PlacesQueryParameters, Circle, GraphicsLayer, WebStyleSymbol]) => {
      
      esriConfig.apiKey = 'AAPK2611c08aa7764a6c83c094d340e63b7bCP-py9sFcQZBsfKLsJG4ZekGB7SaJ5x1TTY-pv2T_Upv4q2gtxagAcfmRDppb7pV';
      let infoPanel;  // Info panel for place information
      let clickPoint;  // Clicked point on the map
      let activeCategory = "16000";  // Landmarks and Outdoors category

      // GraphicsLayer for places features
      const placesLayer = new GraphicsLayer({
        id: "placesLayer"
      });
      // GraphicsLayer for map buffer
      const bufferLayer = new GraphicsLayer({
        id: "bufferLayer"
      });

      // Info panel interactions
      const categorySelect = document.getElementById("categorySelect");
      const resultPanel = document.getElementById("results");
      const flow = document.getElementById("flow");

      const map = new Map({
        basemap: 'arcgis/navigation', // Replace with the desired basemap
        layers: [bufferLayer, placesLayer]
      });

      const view = new MapView({
        map: map,
        center: [-118.5526, 34.1012], // Longitude, latitude for West LA
        zoom: 10,
        container: 'viewDiv' // ID of the HTML container element
      });

      //Add the coffee shops in West LA
      const coffeeShopsLayer = new FeatureLayer({
        url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/ArcGIS/rest/services/Find%20Locations%20in%20LA%20West%20Coffee%20Shops/FeatureServer/layers", // Replace with the URL of the coffee shops layer
        outFields: ["Name", "Address"], // Fields to display in the popup
        popupTemplate: new PopupTemplate({
          title: "{Name}",
          content: "Address: {Address}"
        })
      });

      // Add a CSS rule to change cursor to "pointer" on hover
      coffeeShopsLayer.renderer = {
        type: "simple", // Use simple renderer
        cursor: "pointer",
        symbol: {
          type: "simple-marker",
          style: "diamond",
          color: "gold",
          size: 10,
          cursor: "pointer",
          // Set the CSS class for the coffee shop markers
          className: "coffee-shop-marker"
        }
      };

      map.add(coffeeShopsLayer);

      const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";
        

      //Click Event for calculating the direction
        view.on("click", function(event){
          clickPoint = event.mapPoint;
          const locationGraphic = createGraphic(clickPoint);
          const driveTimeCutoffs = [5,10,15]; // Minutes
          const serviceAreaParams = createServiceAreaParams(locationGraphic, driveTimeCutoffs, view.spatialReference);
           solveServiceArea(serviceAreaUrl, serviceAreaParams);
           clickPoint && showPlaces(clickPoint);
          // Event listener for category changes
          categorySelect.addEventListener("calciteComboboxChange", () => {
          activeCategory = categorySelect.value;
          clearGraphics();
          // Pass point to the showPlaces() function with new category value
          clickPoint && showPlaces(clickPoint);
           // Display map click search area and pass to places service
          async function showPlaces(placePoint) {
        // Buffer graphic represents click location and search radius
        const circleGeometry = new Circle({
          center: placePoint,
          geodesic: true,
          numberOfPoints: 100,
          radius: 500,  // set radius to 500 meters
          radiusUnit: "meters"
        });
        const circleGraphic = new Graphic({
          geometry: circleGeometry,
          symbol: {
            type: "simple-fill",  // autocasts as SimpleFillSymbol
            style: "solid",
            color: [3, 140, 255, 0.1],
            outline: {
              width: 1,
              color: [3, 140, 255],
            },
          }
        });
        // Add buffer graphic to the view
        bufferLayer.graphics.add(circleGraphic);
        // Parameters for queryPlacesNearPoint()
      const placesQueryParameters = new PlacesQueryParameters({
        categoryIds: [activeCategory],
        radius: 500,  // set radius to 500 meters
        point: placePoint
      });
      // The results variable represents the PlacesQueryResult
      const results = await places.queryPlacesNearPoint(
        placesQueryParameters
      );
      // Pass the PlacesQueryResult to the tabulatePlaces() function
      tabulatePlaces(results);
      }
    });

      });

      //Click Event for vieeing hte Coffee shop info
      view.whenLayerView(coffeeShopsLayer).then(function(layerView) {
        view.on("click", function(event) {
          view.hitTest(event).then(function(response) {
            if (response.results.length) {
              const graphic = response.results[0].graphic;
              view.popup.open({
                location: event.mapPoint,
                features: [graphic]
              });
            }
          });
        });
      });

      async function showPlaces(placePoint) {
        // Buffer graphic represents click location and search radius
        const circleGeometry = new Circle({
          center: placePoint,
          geodesic: true,
          numberOfPoints: 100,
          radius: 500,  // set radius to 500 meters
          radiusUnit: "meters"
        });
        const circleGraphic = new Graphic({
          geometry: circleGeometry,
          symbol: {
            type: "simple-fill",  // autocasts as SimpleFillSymbol
            style: "solid",
            color: [3, 140, 255, 0.1],
            outline: {
              width: 1,
              color: [3, 140, 255],
            },
          }
        });
        // Add buffer graphic to the view
        bufferLayer.graphics.add(circleGraphic);
      }

      // Investigate the individual PlaceResults from the array of results
    // from the PlacesQueryResult and process them
    function tabulatePlaces(results) {
      results.results.forEach((placeResult) => {
        // Pass each result to the addResult() function
        addResult(placeResult);
      });
    }

    // Creates webstyles based on the given name
    function createWebStyle(symbolName) {
      return new WebStyleSymbol({
        name: symbolName,
        styleName: "Esri2DPointSymbolsStyle"
      });
    }

    // Visualize the places on the map based on category
    // and list them on the info panel with more details
    async function addResult(place) {
      const placeGraphic = new Graphic({
        geometry: place.location
      });
      switch (activeCategory) {
        case "10000":  // Arts and Entertainment
          placeGraphic.symbol = createWebStyle("museum");
          break;
        case "11000":  // Business and Professional Services
          placeGraphic.symbol = createWebStyle("industrial-complex");
          break;
        case "12000":  // Community and Government
          placeGraphic.symbol = createWebStyle("embassy");
          break;
        case "13000":  // Dining and Drinking
          placeGraphic.symbol = createWebStyle("vineyard");
          break;
        case "15000":  // Health and Medicine
          placeGraphic.symbol = createWebStyle("hospital");
          break;
        case "16000":  // Landmarks and Outdoors category
          placeGraphic.symbol = createWebStyle("landmark");
          break;
        case "17000":  // Retail
          placeGraphic.symbol = createWebStyle("shopping-center");
          break;
        case "18000":  // Sports and Recreation
          placeGraphic.symbol = createWebStyle("sports-complex");
          break;
        case "19000":  // Travel and Transportation
          placeGraphic.symbol = createWebStyle("trail");
          break;
        default:
          placeGraphic.symbol = createWebStyle("museum");
      }
      // Add each graphic to the GraphicsLayer
      placesLayer.graphics.add(placeGraphic);
      const infoDiv = document.createElement("calcite-list-item");
      infoDiv.label = place.name;
      infoDiv.description = `
  ${place.categories[0].label} -
  ${Number((place.distance / 1000).toFixed(1))} km`;;
  // If a place in the info panel is clicked
  // then open the feature's popup
  infoDiv.addEventListener("click", async () => {
    view.openPopup({
      location: place.location,
      title: place.name
    });
    // Move the view to center on the selected place feature
    view.goTo(placeGraphic);
    // Fetch more details about each place based
        // on the place ID with all possible fields
        const fetchPlaceParameters = new FetchPlaceParameters({
          placeId: place.placeId,
          requestedFields: ["all"]
        });
        // Pass the FetchPlaceParameters and the location of the
        // selected place feature to the getDetails() function
        getDetails(fetchPlaceParameters, place.location);
      });
      resultPanel.appendChild(infoDiv);
    }

        // Get place details and display in the info panel
        async function getDetails(fetchPlaceParameters, placePoint) {
          // Get place details
          const result = await places.fetchPlace(fetchPlaceParameters);
          const placeDetails = result.placeDetails;
          // Set-up panel on the info for more place information
      infoPanel = document.createElement("calcite-flow-item");
      flow.appendChild(infoPanel);
      infoPanel.heading = placeDetails.name;
      infoPanel.description = placeDetails.categories[0].label;
      // Pass attributes from each place to the setAttribute() function
      setAttribute("Description", "information", placeDetails.description);
      setAttribute(
        "Address",
        "map-pin",
        placeDetails.address.streetAddress
      );
      setAttribute("Phone", "mobile", placeDetails.contactInfo.telephone);
      setAttribute("Hours", "clock", placeDetails.hours.openingText);
      setAttribute("Rating", "star", placeDetails.rating.user);
      setAttribute(
        "Email",
        "email-address",
        placeDetails.contactInfo.email
      );
      setAttribute(
        "Facebook",
        "speech-bubble-social",
        placeDetails.socialMedia.facebookId ?
        `www.facebook.com/${placeDetails.socialMedia.facebookId}` :
        null
      );
      setAttribute(
        "Twitter",
        "speech-bubbles",
        placeDetails.socialMedia.twitter ?
        `www.twitter.com/${placeDetails.socialMedia.twitter}` :
        null
      );
      setAttribute(
        "Instagram",
        "camera",
        placeDetails.socialMedia.instagram ?
        `www.instagram.com/${placeDetails.socialMedia.instagram}` :
        null
      );
      // If another place is clicked in the info panel, then close
      // the popup and remove the highlight of the previous feature
      infoPanel.addEventListener("calciteFlowItemBack", async () => {
        view.closePopup();
      });

        }

      // Create the location graphic
      function createGraphic(point) {
        view.graphics.removeAll();
        const graphic = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: "white",
            size: 8
          }
        });

        view.graphics.add(graphic);
        return graphic;
      }

      // Take each place attribute and display on info panel
    function setAttribute(heading, icon, validValue) {
      if (validValue) {
        const element = document.createElement("calcite-block");
        element.heading = heading;
        element.description = validValue;
        const attributeIcon = document.createElement("calcite-icon");
        attributeIcon.icon = icon;
        attributeIcon.slot = "icon";
        attributeIcon.scale = "m";
        element.appendChild(attributeIcon);
        infoPanel.appendChild(element);
      }
    }

        
        function createServiceAreaParams(locationGraphic, driveTimeCutoffs, outSpatialReference) {
            // Create one or more locations (facilities) to solve for
        const featureSet = new FeatureSet({
          features: [locationGraphic]
        });
          
          // Set all of the input parameters for the service
        const taskParameters = new ServiceAreaParams({
          facilities: featureSet,
          defaultBreaks: driveTimeCutoffs,
          trimOuterPolygon: true,
          outSpatialReference: outSpatialReference
        });
        return taskParameters;

      }
        
        function solveServiceArea(url, serviceAreaParams) {
          
          return serviceArea.solve(url, serviceAreaParams)
          .then(function(result){
            if (result.serviceAreaPolygons.features.length) {
              // Draw each service area polygon
              result.serviceAreaPolygons.features.forEach(function(graphic){
                graphic.symbol = {
                  type: "simple-fill",
                  color: "rgba(55,50,250,.4)"
                }
                view.graphics.add(graphic,0);
              });
              // const coffeeShopsLayer = new FeatureLayer({
              //   url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/ArcGIS/rest/services/Find%20Locations%20in%20LA%20West%20Coffee%20Shops/FeatureServer/layers" // Replace with the URL of the coffee shops layer
              // });
              // map.add(coffeeShopsLayer);
            }
          }, function(error){
            console.log(error);
          });


      }

      function clearGraphics() {
        bufferLayer.removeAll();  // Remove graphics from GraphicsLayer of previous buffer
        placesLayer.removeAll();  // Remove graphics from GraphicsLayer of previous places search
        resultPanel.innerHTML = "";
        if (infoPanel) infoPanel.remove();
      }



      });
  }, []);

  return <div id="viewDiv" style={{ height: '100vh', width: '100vw' }}></div>;
}

export default ArcGISMap;
