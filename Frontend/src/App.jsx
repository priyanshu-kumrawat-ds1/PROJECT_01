import { useState } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline }
 from "react-leaflet";
 import "leaflet/dist/leaflet.css";
 import Dashboard from "./Dashboard";

function App() {
  console.log("Current Path:", window.location.pathname);

  const [depot, setDepot] = useState("");
const [destination, setDestination] = useState("");
const [demand, setDemand] = useState("");
const [destinations, setDestinations] = useState([]);

const [vehicleCount, setVehicleCount] = useState(3);
const [vehicleCapacities, setVehicleCapacities] = useState([100,50,200]);
const handleVehicleCountChange = (count) => {
  setVehicleCount(count);

  setVehicleCapacities((currentCapacities) => {
    const updatedCapacities = [...currentCapacities];

    while (updatedCapacities.length < count) {
      updatedCapacities.push(100);
    }

    return updatedCapacities.slice(0, count);
  });
};

  const [showDashboard, setShowDashboard] = useState(false);
  const [route, setRoute] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [distance, setDistance] = useState(18.5);
  const [estimatedTime, setEstimatedTime] = useState(42);
  const [stops, setStops] = useState(3);

  
  const handleRoute = async () => {
  if (!depot || destinations.length === 0) {
    alert("Please enter depot and at least one destination");
    return;
  }

 if (
  vehicleCount < 1 ||
  vehicleCapacities.length !== vehicleCount ||
  vehicleCapacities.some((capacity) => capacity < 1)
) {
  alert("Please enter valid vehicle capacities");
  return;
}

console.log("Depot:", depot);
console.log("Destinations:", destinations);
console.log("Vehicle Count:", vehicleCount);
console.log("Vehicle Capacities (kg):", vehicleCapacities);

setStops(destinations.length);

  // Temporary demo values until backend API is connected
  setDistance(18.5 + destinations.length * 7.2);
  setEstimatedTime(42 + destinations.length * 15);

  setVehicles([
    {
      id: "Vehicle 1",
      color: "#00008B",
      routePath: [
        [12.9766, 77.5713],
        [12.9730, 77.6500],
        [12.9698, 77.7500]
      ]
    },
    {
      id: "Vehicle 2",
      color: "#F97316",
      routePath: [
        [12.9766, 77.5713],
        [12.9900, 77.6600],
        [12.9698, 77.7500]
      ]
    },
    {
      id: "Vehicle 3",
      color: "#006400",
      routePath: [
        [12.9766, 77.5713],
        [12.9400, 77.6600],
        [12.9698, 77.7500]
      ]
    }
  ]);
};

if (showDashboard) {
  return <Dashboard/> ;
}
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>OptiRoute</h1>
          <p>Smart Route Planning & Optimization</p>
        </div>

        <div className="city">
          📍 Bengaluru
        </div>
        <button
  className="dashboard-btn"
  onClick={() => setShowDashboard(true)}
>
  📊 Dashboard
</button>

      </header>

      <main className="dashboard">
        <section className="control-panel">
          <h2>Route Optimization</h2>

          <label>Depot</label>
          <input
            type="text"
            placeholder="Enter depot location"
            value={depot}
            onChange={(e) =>
              setDepot(e.target.value)
            }
          />

          <label>Destination</label>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <label>Demand</label>
          <input type="number"
          min="1"
          placeholder="Enter demand in kg"
          value={demand}
          onChange={(e) => setDemand(e.target.value)}
          />
          <label>Number of Vehicles</label>
<input
  type="number"
  min="1"
  placeholder="Enter number of vehicles"
  value={vehicleCount}
  onChange={(e) => handleVehicleCountChange(Number(e.target.value))}
/>

<label>Vehicle Capacities (kg)</label>

{Array.from({ length: vehicleCount }, (_, index) => (
  <div key={index}>
    <label>Vehicle {index + 1} capacity (kg)</label>
    <input
      type="number"
      min="1"
      placeholder={`Enter Vehicle ${index + 1} capacity`}
      value={vehicleCapacities[index] || ""}
      onChange={(e) => {
        const updatedCapacities = [...vehicleCapacities];
        updatedCapacities[index] = Number(e.target.value);
        setVehicleCapacities(updatedCapacities);
      }}
    />
  </div>
))}

          {destinations.length > 0 && (
  <div className="destination-list">
    {destinations.map((item, index) => (
      <div className="destination-item" key={index}>
        <strong>Destination {index + 1}</strong>

        <div>
          Location: {item.name}
        </div>

        <div>
          Demand: {item.demand} kg
        </div>
      </div>
    ))}
  </div>
)}

          <button
  className="add-btn"
  onClick={() => {
  if (!destination.trim() || !demand.trim()) {
    alert("Please enter destination and demand");
    return;
  }

  setDestinations([
    ...destinations,
    {
      name: destination,
      demand: Number(demand)
    }
  ]);

  setDestination("");
  setDemand("");
}}
>
  + Add Destination
</button>

          <button className="optimize-btn"
            onClick={handleRoute}>
            ⚡ Optimize Routes
          </button>

          <div className="route-info">
            <h3>Route Summary</h3>
            <div className="info-row">
              <span>Distance</span>
              <strong>{distance} km</strong>
            </div>
            <div className="info-row">
              <span>Estimated Time</span>
              <strong>{estimatedTime} min</strong>
            </div>
            <div className="info-row">
              <span>Stops</span>
              <strong>{stops}</strong>
            </div>
          </div>
        </section>

        <section className="map-section">
          <MapContainer
  center={[12.9716, 77.5946]}
  zoom={12}
  className="map"
  style={{height: "100%", width:"100%"}}
>
  <TileLayer
    attribution='&copy; OpenStreetMap contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  <Marker position={[12.9716, 77.5946]}>
  <Popup>
    Starting Point - Bengaluru
  </Popup>
</Marker>
<Marker position={[12.9352, 77.6245]}>
  <Popup>
    Destination
  </Popup>
</Marker>
{vehicles.map((vehicle) => (
  <Polyline
    key={vehicle.id}
    positions={vehicle.routePath}
    color={vehicle.color}
    weight={7}
  />
))}
  
</MapContainer>
        </section>
      </main>
    </div>
  );
}

export default App; 
