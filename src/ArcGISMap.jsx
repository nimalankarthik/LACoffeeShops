import React, { useEffect } from 'react';
import { loadModules } from 'esri-loader'; // This is a library to load ArcGIS modules asynchronously

function ArcGISMap() {
  useEffect(() => {
    loadModules([
      'esri/config',
      'esri/Map',
      'esri/views/MapView',
      'esri/rest/serviceArea',
      'esri/rest/support/ServiceAreaParameters',
      'esri/rest/support/FeatureSet',
      'esri/Graphic'
    ]).then(([esriConfig, Map, MapView, serviceArea, ServiceAreaParams, FeatureSet, Graphic]) => {
      esriConfig.apiKey = 'AAPK2611c08aa7764a6c83c094d340e63b7bCP-py9sFcQZBsfKLsJG4ZekGB7SaJ5x1TTY-pv2T_Upv4q2gtxagAcfmRDppb7pV';

      const map = new Map({
        basemap: 'arcgis/navigation' // Replace with the desired basemap
      });

      const view = new MapView({
        map: map,
        center: [-118.3526, 34.0012], // Longitude, latitude for West LA
        zoom: 11,
        container: 'viewDiv' // ID of the HTML container element
      });

      const serviceAreaUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea";
        
        view.on("click", function(event){
          const locationGraphic = createGraphic(event.mapPoint);
          const driveTimeCutoffs = [5,10,15]; // Minutes
        const serviceAreaParams = createServiceAreaParams(locationGraphic, driveTimeCutoffs, view.spatialReference);
           solveServiceArea(serviceAreaUrl, serviceAreaParams);

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
                  color: "rgba(55,250,50,.25)"
                }
                view.graphics.add(graphic,0);
              });
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
