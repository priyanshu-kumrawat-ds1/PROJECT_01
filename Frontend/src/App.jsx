import { useState } from "react";
import "./App.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import Dashboard from "./Dashboard";


/* =========================================================
   MAP CLICK HANDLER
   ========================================================= */

function MapClickHandler({
  selectingDepot,
  selectingDestination,
  onDepotSelect,
  onDestinationSelect,
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      if (selectingDepot) {
        onDepotSelect({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        });

        return;
      }

      if (selectingDestination) {
        onDestinationSelect({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        });
      }
    },
  });

  return null;
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  /* ---------------- DEPOT ---------------- */

  const [depot, setDepot] = useState(null);

  const [selectingDepot, setSelectingDepot] = useState(false);


  /* ---------------- DESTINATIONS ---------------- */

  const [destinations, setDestinations] = useState([]);

  const [selectingDestination, setSelectingDestination] =
    useState(false);

  const [selectedDestination, setSelectedDestination] =
    useState(null);

  const [demand, setDemand] = useState("");


  /* ---------------- VEHICLES ---------------- */

  const [vehicleCount, setVehicleCount] = useState(3);

  const [vehicleCapacities, setVehicleCapacities] =
    useState([100, 50, 200]);


  /* ---------------- RESULT ---------------- */

  const [vehicles, setVehicles] = useState([]);

  const [distance, setDistance] = useState(0);

  const [estimatedTime, setEstimatedTime] = useState(0);

  const [stops, setStops] = useState(0);

  const [loading, setLoading] = useState(false);


  /* =========================================================
     DEPOT SELECTION
     ========================================================= */

  const handleDepotSelect = (location) => {
    setDepot(location);
    setSelectingDepot(false);

    console.log("Selected Depot:", location);
  };


  /* =========================================================
     DESTINATION SELECTION
     ========================================================= */

  const handleDestinationSelect = (location) => {
    setSelectedDestination(location);
    setSelectingDestination(false);

    console.log("Selected Destination:", location);
  };


  /* =========================================================
     ADD DESTINATION
     ========================================================= */

  const handleAddDestination = () => {
    if (!selectedDestination) {
      alert("Please click on the map to select a destination.");
      return;
    }

    if (!demand.trim()) {
      alert("Please enter demand.");
      return;
    }

    const demandValue = Number(demand);

    if (!Number.isFinite(demandValue) || demandValue <= 0) {
      alert("Please enter a valid demand.");
      return;
    }


    const newDestination = {
      node_id: destinations.length + 1,

      latitude: selectedDestination.latitude,

      longitude: selectedDestination.longitude,

      demand: demandValue,

      earliest: 0,

      latest: 1000,

      service_time: 10,
    };


    setDestinations((current) => [
      ...current,
      newDestination,
    ]);


    setSelectedDestination(null);

    setDemand("");

    console.log(
      "Added Destination:",
      newDestination
    );
  };


  /* =========================================================
     VEHICLE COUNT
     ========================================================= */

  const handleVehicleCountChange = (value) => {
    const count = Number(value);

    if (!Number.isFinite(count) || count < 1) {
      return;
    }

    setVehicleCount(count);


    setVehicleCapacities((currentCapacities) => {
      const updated = [...currentCapacities];

      while (updated.length < count) {
        updated.push(100);
      }

      return updated.slice(0, count);
    });
  };


  /* =========================================================
     VEHICLE CAPACITY
     ========================================================= */

  const handleVehicleCapacityChange = (
    index,
    value
  ) => {
    const updated = [...vehicleCapacities];

    updated[index] = value;

    setVehicleCapacities(updated);
  };


  /* =========================================================
     OPTIMIZATION REQUEST
     ========================================================= */

  const handleRoute = async () => {

    /* ---------- VALIDATE DEPOT ---------- */

    if (!depot) {
      alert("Please select a depot on the map.");
      return;
    }


    /* ---------- VALIDATE DESTINATIONS ---------- */

    if (destinations.length === 0) {
      alert("Please add at least one destination.");
      return;
    }


    /* ---------- VALIDATE VEHICLES ---------- */

    if (
      vehicleCount < 1 ||
      vehicleCapacities.length !== vehicleCount
    ) {
      alert("Please enter valid vehicle information.");
      return;
    }


    const capacities = vehicleCapacities.map(
      (capacity) => Number(capacity)
    );


    if (
      capacities.some(
        (capacity) =>
          !Number.isFinite(capacity) ||
          capacity <= 0
      )
    ) {
      alert("Please enter valid vehicle capacities.");
      return;
    }


    /* =====================================================
       BUILD EXACT BACKEND SCHEMA
       ===================================================== */

    const requestData = {

      depot: {
        latitude: depot.latitude,
        longitude: depot.longitude,
      },


      customers: destinations.map(
        (destination) => ({
          node_id: destination.node_id,

          latitude: destination.latitude,

          longitude: destination.longitude,

          demand: destination.demand,

          earliest: destination.earliest,

          latest: destination.latest,

          service_time:
            destination.service_time,
        })
      ),


      vehicles: capacities.map(
        (capacity, index) => ({
          vehicle_id: index + 1,

          capacity: capacity,
        })
      ),
    };


    console.log(
      "Sending request to backend:",
      JSON.stringify(
        requestData,
        null,
        2
      )
    );


    /* =====================================================
       CALL FASTAPI
       ===================================================== */

    try {

      setLoading(true);


      const response = await fetch(
        "http://127.0.0.1:8000/optimization",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestData
          ),
        }
      );


      console.log(
        "Backend HTTP status:",
        response.status
      );


      /* ---------- BACKEND ERROR ---------- */

      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(
          "Backend error:",
          errorText
        );


        throw new Error(
          `Backend returned ${response.status}: ${errorText}`
        );
      }


      /* ---------- READ JSON ---------- */

      const result =
        await response.json();


      console.log(
        "Backend response:",
        result
      );


      /* =================================================
         HANDLE RESPONSE
         ================================================= */

      if (result.distance !== undefined) {
        setDistance(
          Number(result.distance)
        );
      }


      if (
        result.total_distance !==
        undefined
      ) {
        setDistance(
          Number(
            result.total_distance
          )
        );
      }


      if (
        result.estimated_time !==
        undefined
      ) {
        setEstimatedTime(
          Number(
            result.estimated_time
          )
        );
      }


      if (
        result.total_time !==
        undefined
      ) {
        setEstimatedTime(
          Number(result.total_time)
        );
      }


      setStops(
        destinations.length
      );


      /* =================================================
         HANDLE VEHICLE ROUTES
         ================================================= */

      if (
        Array.isArray(
          result.vehicles
        )
      ) {

        const formattedVehicles =
          result.vehicles.map(
            (vehicle, index) => {

              let routePath = [];


              /*
               * Backend may return:
               *
               * route:
               * [
               *   {
               *     latitude: ...,
               *     longitude: ...
               *   }
               * ]
               *
               * OR:
               *
               * route:
               * [
               *   [latitude, longitude]
               * ]
               */


              if (
                Array.isArray(
                  vehicle.route
                )
              ) {

                routePath =
                  vehicle.route
                    .map((point) => {

                      if (
                        Array.isArray(point) &&
                        point.length >= 2
                      ) {
                        return [
                          Number(point[0]),
                          Number(point[1]),
                        ];
                      }


                      if (
                        point &&
                        point.latitude !==
                          undefined &&
                        point.longitude !==
                          undefined
                      ) {
                        return [
                          Number(
                            point.latitude
                          ),
                          Number(
                            point.longitude
                          ),
                        ];
                      }


                      return null;
                    })
                    .filter(Boolean);
              }


              return {
                id:
                  vehicle.vehicle_id ??
                  `Vehicle ${index + 1}`,

                color:
                  [
                    "#00008B",
                    "#F97316",
                    "#006400",
                    "#8B0000",
                    "#800080",
                    "#008B8B",
                  ][
                    index %
                      6
                  ],

                routePath,
              };
            }
          );


        setVehicles(
          formattedVehicles
        );
      }


      alert(
        "Routes optimized successfully."
      );

    } catch (error) {

      console.error(
        "Optimization error:",
        error
      );


      alert(
        `Could not connect to the backend.\n\n${error.message}`
      );

    } finally {

      setLoading(false);

    }
  };


  /* =========================================================
     DASHBOARD
     ========================================================= */

  if (showDashboard) {
    return (
      <Dashboard />
    );
  }


  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>
          <h1>
            OptiRoute
          </h1>

          <p>
            Smart Route Planning &
            Optimization
          </p>
        </div>


        <div className="city">
          📍 Bengaluru
        </div>


        <button
          className="dashboard-btn"
          onClick={() =>
            setShowDashboard(true)
          }
        >
          📊 Dashboard
        </button>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard">


        {/* =================================================
            CONTROL PANEL
        ================================================= */}

        <section className="control-panel">

          <h2>
            Route Optimization
          </h2>


          {/* =================================================
              DEPOT
          ================================================= */}

          <label>
            Depot
          </label>


          <button
            className="map-select-btn"
            onClick={() =>
              setSelectingDepot(true)
            }
          >
            📍 Click on map to select
            depot
          </button>


          {depot && (

            <div className="selected-location">

              <strong>
                Selected Depot
              </strong>

              <div>
                Latitude:{" "}
                {depot.latitude}
              </div>

              <div>
                Longitude:{" "}
                {depot.longitude}
              </div>

            </div>

          )}


          {selectingDepot && (

            <p className="selection-message">
              👆 Click anywhere on the
              map to select the depot.
            </p>

          )}


          {/* =================================================
              DESTINATION
          ================================================= */}

          <label>
            Destination
          </label>


          <button
            className="map-select-btn"
            onClick={() =>
              setSelectingDestination(
                true
              )
            }
          >
            📍 Click on map to select
            destination
          </button>


          {selectedDestination && (

            <div className="selected-location">

              <strong>
                Selected Destination
              </strong>

              <div>
                Latitude:{" "}
                {
                  selectedDestination.latitude
                }
              </div>

              <div>
                Longitude:{" "}
                {
                  selectedDestination.longitude
                }
              </div>

            </div>

          )}


          {selectingDestination && (

            <p className="selection-message">
              👆 Click anywhere on the
              map to select the destination.
            </p>

          )}


          {/* =================================================
              DEMAND
          ================================================= */}

          <label>
            Demand
          </label>


          <input
            type="text"
            inputMode="decimal"
            placeholder="Enter demand in kg"
            value={demand}
            onChange={(e) =>
              setDemand(e.target.value)
            }
          />


          {/* =================================================
              ADD DESTINATION
          ================================================= */}

          <button
            className="add-btn"
            onClick={
              handleAddDestination
            }
          >
            + Add Destination
          </button>


          {/* =================================================
              DESTINATION LIST
          ================================================= */}

          {destinations.length > 0 && (

            <div className="destination-list">

              {destinations.map(
                (item, index) => (

                  <div
                    className="destination-item"
                    key={item.node_id}
                  >

                    <strong>
                      Destination{" "}
                      {index + 1}
                    </strong>


                    <div>
                      Latitude:{" "}
                      {item.latitude}
                    </div>


                    <div>
                      Longitude:{" "}
                      {item.longitude}
                    </div>


                    <div>
                      Demand:{" "}
                      {item.demand} kg
                    </div>

                  </div>

                )
              )}

            </div>

          )}


          {/* =================================================
              VEHICLE COUNT
          ================================================= */}

          <label>
            Number of Vehicles
          </label>


          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter number of vehicles"
            value={vehicleCount}
            onChange={(e) =>
              handleVehicleCountChange(
                e.target.value
              )
            }
          />


          {/* =================================================
              VEHICLE CAPACITIES
          ================================================= */}

          <label>
            Vehicle Capacities (kg)
          </label>


          {Array.from(
            {
              length:
                vehicleCount,
            },
            (_, index) => (

              <div
                key={index}
                className="vehicle-capacity"
              >

                <label>
                  Vehicle{" "}
                  {index + 1}{" "}
                  capacity (kg)
                </label>


                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`Enter Vehicle ${
                    index + 1
                  } capacity`}
                  value={
                    vehicleCapacities[
                      index
                    ] ?? ""
                  }
                  onChange={(e) =>
                    handleVehicleCapacityChange(
                      index,
                      e.target.value
                    )
                  }
                />

              </div>

            )
          )}


          {/* =================================================
              OPTIMIZE
          ================================================= */}

          <button
            className="optimize-btn"
            onClick={
              handleRoute
            }
            disabled={loading}
          >

            {loading
              ? "⏳ Optimizing..."
              : "⚡ Optimize Routes"}

          </button>


          {/* =================================================
              ROUTE SUMMARY
          ================================================= */}

          <div className="route-info">

            <h3>
              Route Summary
            </h3>


            <div className="info-row">

              <span>
                Distance
              </span>

              <strong>
                {distance} km
              </strong>

            </div>


            <div className="info-row">

              <span>
                Estimated Time
              </span>

              <strong>
                {estimatedTime} min
              </strong>

            </div>


            <div className="info-row">

              <span>
                Stops
              </span>

              <strong>
                {stops}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            MAP
        ================================================= */}

        <section className="map-section">

          <MapContainer
            center={[
              12.9716,
              77.5946,
            ]}
            zoom={12}
            className="map"
            style={{
              height: "100%",
              width: "100%",
            }}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* MAP CLICK HANDLER */}

            <MapClickHandler
              selectingDepot={
                selectingDepot
              }
              selectingDestination={
                selectingDestination
              }
              onDepotSelect={
                handleDepotSelect
              }
              onDestinationSelect={
                handleDestinationSelect
              }
            />


            {/* =================================================
                DEPOT MARKER
            ================================================= */}

            {depot && (

              <Marker
                position={[
                  depot.latitude,
                  depot.longitude,
                ]}
              >

                <Popup>
                  <strong>
                    Depot
                  </strong>

                  <br />

                  Latitude:{" "}
                  {depot.latitude}

                  <br />

                  Longitude:{" "}
                  {depot.longitude}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                SELECTED DESTINATION MARKER
            ================================================= */}

            {selectedDestination && (

              <Marker
                position={[
                  selectedDestination.latitude,
                  selectedDestination.longitude,
                ]}
              >

                <Popup>
                  <strong>
                    New Destination
                  </strong>

                  <br />

                  Latitude:{" "}
                  {
                    selectedDestination.latitude
                  }

                  <br />

                  Longitude:{" "}
                  {
                    selectedDestination.longitude
                  }

                </Popup>

              </Marker>

            )}


            {/* =================================================
                DESTINATION MARKERS
            ================================================= */}

            {destinations.map(
              (destination) => (

                <Marker
                  key={
                    destination.node_id
                  }
                  position={[
                    destination.latitude,
                    destination.longitude,
                  ]}
                >

                  <Popup>

                    <strong>
                      Destination{" "}
                      {
                        destination.node_id
                      }
                    </strong>

                    <br />

                    Demand:{" "}
                    {
                      destination.demand
                    }{" "}
                    kg

                  </Popup>

                </Marker>

              )
            )}


            {/* =================================================
                VEHICLE ROUTES
            ================================================= */}

            {vehicles.map(
              (vehicle) => (

                <Polyline
                  key={
                    vehicle.id
                  }
                  positions={
                    vehicle.routePath
                  }
                  color={
                    vehicle.color
                  }
                  weight={7}
                />

              )
            )}

          </MapContainer>

        </section>

      </main>

    </div>
  );
}


export default App;