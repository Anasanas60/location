import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [position, setPosition] = useState([23.8103, 90.4125]);
  const [hasLocation, setHasLocation] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState([]);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");

  // Hawai Golli place
  const place = {
    name: "Hawai Golli",
    position: [23.743429, 90.434072],
    radius: 100, // meters
  };

  // Haversine formula to check if inside circle
  function isInsidePlace(userPos, placePos, radius) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(placePos[0] - userPos[0]);
    const dLon = toRad(placePos[1] - userPos[1]);
    const lat1 = toRad(userPos[0]);
    const lat2 = toRad(placePos[0]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d <= radius;
  }

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        (err) => {
          setError("Could not get your location.");
        }
      );
    }
  }, []);

  // Registration handler
  const handleRegister = (e) => {
  e.preventDefault();
  fetch("https://ffe71eb7ae4d.ngrok-free.app//api/locations/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: regUsername,
      password: regPassword,
    }),
  })
    .then(async (res) => {
      if (res.ok) {
        setRegMessage("Registration successful! You can now log in.");
      } else {
        const data = await res.json();
        // Show the real error from Django
        if (data.username) {
          setRegMessage("Username error: " + data.username.join(" "));
        } else if (data.password) {
          setRegMessage("Password error: " + data.password.join(" "));
        } else {
          setRegMessage("Registration failed. Try a different username.");
        }
      }
    })
    .catch(() => setRegMessage("Registration failed. Server error."));
};

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    fetch("https://ffe71eb7ae4d.ngrok-free.app/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Login failed!");
        return res.json();
      })
      .then((data) => {
        setToken(data.access);
        setError("");
        // After login, send location and fetch all friends
        sendLocation(data.access);
        fetchLocations(data.access);
      })
      .catch(() => setError("Login failed! Check your username and password."));
  };

  // Send your location to Django
  const sendLocation = (accessToken) => {
    fetch("https://ffe71eb7ae4d.ngrok-free.app/api/locations/update/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        latitude: position[0],
        longitude: position[1],
        status: "Online",
      }),
    });
  };

  // Fetch all friends' locations
  const fetchLocations = (accessToken) => {
    fetch("https://ffe71eb7ae4d.ngrok-free.app/api/locations/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLocations(data));
  };

  // Show registration and login forms if not logged in
  if (!token) {
    return (
      <div className="container mt-5" style={{ maxWidth: 400 }}>
        <div className="card p-4 shadow">
          <h2 className="mb-4 text-center">Sign Up</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              required
              className="form-control mb-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              className="form-control mb-2"
            />
            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form>
          {regMessage && <div className="alert alert-info mt-3">{regMessage}</div>}
          <hr />
          <h2 className="mb-4 text-center">Login</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-success w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Friends Location Map</h2>
      {/* Notification if inside Hawai Golli */}
      {hasLocation && isInsidePlace(position, place.position, place.radius) && (
        <div className="alert alert-success text-center">
          🎉 You are at {place.name}! Let your friends know!
        </div>
      )}
      <MapContainer center={position} zoom={15} style={{ height: "500px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Your marker */}
        {hasLocation && (
          <Marker position={position}>
            <Popup>
              <b>You are here!</b> <br />
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </Popup>
          </Marker>
        )}
        {/* Friends' markers */}
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.latitude, loc.longitude]}>
            <Popup>
              {loc.user === username ? (
                <b>You are here!</b>
              ) : (
                <>
                  {loc.user} <br />
                  {loc.status}
                </>
              )}
              <br />
              {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
            </Popup>
          </Marker>
        ))}
        {/* Hawai Golli marker and area */}
        <Marker position={place.position}>
          <Popup>
            {place.name} <br />
            {place.position[0]}, {place.position[1]}
          </Popup>
        </Marker>
        <Circle
          center={place.position}
          radius={place.radius}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
        />
      </MapContainer>
    </div>
  );
}

export default App;