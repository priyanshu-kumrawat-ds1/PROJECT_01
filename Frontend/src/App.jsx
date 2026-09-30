import { useState } from "react";
import "./App.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import Dashboard from "./Dashboard";

function App() {
  console.log("Current Path:", window.location.pathname);

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------

  const [depot, setDepot] = useState("");

  const [destination, setDestination] = useState("");
  const [demand, setDemand] = useState("");

  const [destinations, setDestinations] = useState([]);

  const [vehicleCount, setVehicleCount] = useState(3);

  const [vehicleCapacities, setVehicleCapacities] = useState([
    100,
    150,
    200,
  ]);

  // --------------------------------------------------
  // RESULT STATE
  // --------------------------------------------------

  const [vehicles, setVehicles] = useState([]);

  const [distance, setDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [stops, setStops] = useState(0);

  const [showDashboard, setShowDashboard] = useState(false);

  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // VEHICLE COUNT
  // --------------------------------------------------

  const handleVehicleCountChange = (count) => {
    const safeCount = Math.max(1, count || 1);

    setVehicleCount(safeCount);

    setVehicleCapacities((currentCapacities) => {
      const updatedCapacities = [...currentCapacities];

      while (updatedCapacities.length < safeCount) {
        updatedCapacities.push(100);
      }

      return updatedCapacities.slice(0, safeCount);
    });
  };

  // --------------------------------------------------
  // ADD DESTINATION
  // --------------------------------------------------

  const handleAddDestination = () => {
    if (!destination.trim()) {
      alert("Please enter destination");
      return;
    }

    if (!demand || Number(demand) <= 0) {
      alert("Please enter valid demand");
      return;
    }

    const newDestination = {
      name: destination.trim(),
      demand: Number(demand),
    };

    setDestinations((current) => [
      ...current,
      newDestination,
    ]);

    setDestination("");
    setDemand("");
  };

  // --------------------------------------------------
  // OPTIMIZE ROUTES
  // --------------------------------------------------

  const handleRoute = async () => {
    if (!depot.trim()) {
      alert("Please enter depot");
      return;
    }

    if (destinations.length === 0) {
      alert("Please add at least one destination");
      return;
    }

    if (
      vehicleCount < 1 ||
      vehicleCapacities.length !== vehicleCount ||
      vehicleCapacities.some(
        (capacity) => !capacity || capacity < 1
      )
    ) {
      alert("Please enter valid vehicle capacities");
      return;
    }

    // ------------------------------------------------
    // BACKEND EXPECTS:
    //
    // depot: int
    // customers: [
    //   {
    //     node_id: int,
    //     demand: float,
    //     earliest: float,
    //     latest: float,
    //     service_time: float
    //   }
    // ]
    //
    // vehicles: [
    //   {
    //     vehicle_id: int,
    //     capacity: float
    //   }
    // ]
    // ------------------------------------------------

    const depotId = Number(depot);

    if (Number.isNaN(depotId)) {
      alert(
        "For now, Depot must be a numeric node ID.\nExample: 0"
      );
      return;
    }

    const requestData = {
      depot: depotId,

      customers: destinations.map((item, index) => ({
        node_id: index + 1,
        demand: Number(item.demand),

        // Default time-window values
        earliest: 0,
        latest: 600,

        // Default service time
        service_time: 10,
      })),

      vehicles: vehicleCapacities.map(
        (capacity, index) => ({
          vehicle_id: index + 1,
          capacity: Number(capacity),
        })
      ),
    };

    console.log(
      "===================================="
    );

    console.log(
      "Sending optimization request:"
    );

    console.log(
      JSON.stringify(requestData, null, 2)
    );

    console.log(
      "===================================="
    );

    setLoading(true);

    try {
      // ------------------------------------------------
      // CONNECT FRONTEND → BACKEND
      // ------------------------------------------------

      const response = await fetch(
        "http://127.0.0.1:8000/optimization",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestData),
        }
      );

      console.log(
        "Backend HTTP status:",
        response.status
      );

      // ------------------------------------------------
      // BACKEND ERROR
      // ------------------------------------------------

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Backend error:",
          errorText
        );

        throw new Error(
          `Backend returned ${response.status}: ${errorText}`
        );
      }

      // ------------------------------------------------
      // READ JSON RESPONSE
      // ------------------------------------------------

      const data = await response.json();

      console.log(
        "Backend response:",
        data
      );

      // ------------------------------------------------
      // RESPONSE → FRONTEND
      // ------------------------------------------------

      const backendVehicles =
        data.vehicles || [];

      const colors = [
        "#00008B",
        "#F97316",
        "#006400",
        "#DC2626",
        "#7C3AED",
        "#0891B2",
        "#CA8A04",
        "#DB2777",
      ];

      const formattedVehicles =
        backendVehicles.map(
          (vehicle, index) => ({
            id:
              vehicle.vehicle_id ??
              `Vehicle ${index + 1}`,

            color:
              colors[index % colors.length],

            routePath:
              vehicle.path || [],

            customers:
              vehicle.customers || [],

            distance:
              vehicle.distance || 0,

            time:
              vehicle.time || 0,

            trafficCost:
              vehicle.traffic_cost || 0,

            totalDemand:
              vehicle.total_demand || 0,

            capacity:
              vehicle.capacity || 0,

            utilization:
              vehicle.utilization || 0,
          })
        );

      setVehicles(formattedVehicles);

      // ------------------------------------------------
      // SUMMARY
      // ------------------------------------------------

      const totalDistance =
        formattedVehicles.reduce(
          (sum, vehicle) =>
            sum + Number(vehicle.distance || 0),
          0
        );

      const totalTime =
        formattedVehicles.reduce(
          (sum, vehicle) =>
            sum + Number(vehicle.time || 0),
          0
        );

      setDistance(
        Number(totalDistance.toFixed(2))
      );

      setEstimatedTime(
        Number(totalTime.toFixed(2))
      );

      setStops(destinations.length);

      console.log(
        "Routes successfully received from backend."
      );
    } catch (error) {
      console.error(
        "Optimization request failed:",
        error
      );

      alert(
        `Optimization failed:\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  if (showDashboard) {
    return <Dashboard />;
  }

  // --------------------------------------------------
  // FRONTEND
  // --------------------------------------------------

  return (
    <div className="app">

      {/* -------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------- */}

      <header className="header">

        <div>
          <h1>OptiRoute</h1>

          <p>
            Smart Route Planning & Optimization
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

      {/* -------------------------------------------- */}
      {/* MAIN */}
      {/* -------------------------------------------- */}

      <main className="dashboard">

        {/* ------------------------------------------ */}
        {/* CONTROL PANEL */}
        {/* ------------------------------------------ */}

        <section className="control-panel">

          <h2>
            Route Optimization
          </h2>

          {/* DEPOT */}

          <label>
            Depot Node ID
          </label>

          <input
            type="number"
            min="0"
            placeholder="Example: 0"
            value={depot}
            onChange={(e) =>
              setDepot(e.target.value)
            }
          />

          {/* DESTINATION */}

          <label>
            Destination
          </label>

          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value)
            }
          />

          {/* DEMAND */}

          <label>
            Demand
          </label>

          <input
            type="number"
            min="1"
            placeholder="Enter demand in kg"
            value={demand}
            onChange={(e) =>
              setDemand(e.target.value)
            }
          />

          {/* VEHICLE COUNT */}

          <label>
            Number of Vehicles
          </label>

          <input
            type="number"
            min="1"
            placeholder="Enter number of vehicles"
            value={vehicleCount}
            onChange={(e) =>
              handleVehicleCountChange(
                Number(e.target.value)
              )
            }
          />

          {/* VEHICLE CAPACITIES */}

          <label>
            Vehicle Capacities (kg)
          </label>

          {Array.from(
            { length: vehicleCount },
            (_, index) => (
              <div key={index}>

                <label>
                  Vehicle {index + 1} capacity (kg)
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder={`Enter Vehicle ${
                    index + 1
                  } capacity`}
                  value={
                    vehicleCapacities[index] || ""
                  }
                  onChange={(e) => {

                    const updatedCapacities = [
                      ...vehicleCapacities,
                    ];

                    updatedCapacities[index] =
                      Number(e.target.value);

                    setVehicleCapacities(
                      updatedCapacities
                    );
                  }}
                />

              </div>
            )
          )}

          {/* DESTINATION LIST */}

          {destinations.length > 0 && (

            <div className="destination-list">

              {destinations.map(
                (item, index) => (

                  <div
                    className="destination-item"
                    key={index}
                  >

                    <strong>
                      Destination {index + 1}
                    </strong>

                    <div>
                      Location: {item.name}
                    </div>

                    <div>
                      Demand: {item.demand} kg
                    </div>

                  </div>
                )
              )}

            </div>
          )}

          {/* ADD DESTINATION */}

          <button
            className="add-btn"
            onClick={
              handleAddDestination
            }
          >
            + Add Destination
          </button>

          {/* OPTIMIZE */}

          <button
            className="optimize-btn"
            onClick={handleRoute}
            disabled={loading}
          >
            {loading
              ? "⏳ Optimizing..."
              : "⚡ Optimize Routes"}
          </button>

          {/* ROUTE SUMMARY */}

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

        {/* ------------------------------------------ */}
        {/* MAP */}
        {/* ------------------------------------------ */}

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

            {/* DEPOT */}

            <Marker
              position={[
                12.9716,
                77.5946,
              ]}
            >
              <Popup>
                Starting Point - Bengaluru
              </Popup>
            </Marker>

            {/* BACKEND ROUTES */}

            {vehicles.map(
              (vehicle) => {

                if (
                  !vehicle.routePath ||
                  vehicle.routePath.length === 0
                ) {
                  return null;
                }

                return (
                  <Polyline
                    key={vehicle.id}
                    positions={
                      vehicle.routePath
                    }
                    color={
                      vehicle.color
                    }
                    weight={7}
                  />
                );
              }
            )}

          </MapContainer>

        </section>

      </main>

    </div>
  );
}

export default App;