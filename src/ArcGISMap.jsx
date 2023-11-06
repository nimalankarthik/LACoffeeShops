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
      "esri/rest/route",
      "esri/rest/support/RouteParameters"
    ]).then(([esriConfig, Map, MapView, serviceArea, ServiceAreaParams, FeatureSet, Graphic, FeatureLayer, PopupTemplate, route, RouteParameters]) => {
      esriConfig.apiKey = process.env.ESRI_API_KEY;

      const map = new Map({
        basemap: 'arcgis/navigation' // Replace with the desired basemap
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

      coffeeShopsLayer.renderer.symbol.set("cursor", "coffee-shop-marker");

      map.add(coffeeShopsLayer);

      const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";
        

      //Click Event for calculating the direction
        view.on("click", function(event){
          const locationGraphic = createGraphic(event.mapPoint);
          const driveTimeCutoffs = [5,10,15]; // Minutes
        const serviceAreaParams = createServiceAreaParams(locationGraphic, driveTimeCutoffs, view.spatialReference);
           solveServiceArea(serviceAreaUrl, serviceAreaParams);

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



   



      });
  }, []);

  return <div id="viewDiv" style={{ height: '100vh', width: '100vw' }}></div>;
}

export default ArcGISMap;
