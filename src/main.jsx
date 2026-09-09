import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";

import {
  MapPin, Compass, BarChart3, Route, Users, IndianRupee, Search,
  ChevronRight, Navigation, Star, ShieldCheck, Hotel, Utensils,
  Store, ArrowRight, TrendingUp, Menu, X, Sparkles, Clock,
  Heart, Zap, Camera, Mountain, CalendarDays
} from "lucide-react";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

import "./styles.css";

/* =========================================================
   VOYAGE DEMO DATA
========================================================= */

const destinations = [
  {
    id: "charminar",
    name: "Charminar",
    place: "Hyderabad",
    crowd: 92,
    rating: 4.6,
    cost: 50,
    time: "Open",
    img: "https://images.unsplash.com/photo-1602774896930-6f0b4a4f6b9d?auto=format&fit=crop&w=1200&q=85",
    type: "Heritage",
    description:
      "The iconic heart of Hyderabad surrounded by centuries of culture, food and architecture."
  },
  {
    id: "paigah",
    name: "Paigah Tombs",
    place: "Hyderabad",
    crowd: 28,
    rating: 4.7,
    cost: 50,
    time: "Open",
    img: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
    type: "Hidden Gem",
    description:
      "A peaceful architectural masterpiece offering a quieter cultural experience."
  },
  {
    id: "golconda",
    name: "Golconda Fort",
    place: "Hyderabad",
    crowd: 64,
    rating: 4.7,
    cost: 40,
    time: "Open",
    img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85",
    type: "Heritage",
    description:
      "Explore ancient walls, royal history and spectacular views over Hyderabad."
  },
  {
    id: "ananthagiri",
    name: "Ananthagiri Hills",
    place: "Telangana",
    crowd: 22,
    rating: 4.5,
    cost: 100,
    time: "Open",
    img: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
    type: "Nature",
    description:
      "Escape the city with forests, viewpoints and refreshing outdoor experiences."
  },
  {
    id: "hampi",
    name: "Hampi",
    place: "Karnataka",
    crowd: 41,
    rating: 4.8,
    cost: 100,
    time: "Open",
    img: "https://images.unsplash.com/photo-1600100397608-f010b5c9c0d5?auto=format&fit=crop&w=1200&q=85",
    type: "Heritage",
    description:
      "Walk through one of India's most extraordinary historical landscapes."
  },
  {
    id: "kerala",
    name: "Alleppey",
    place: "Kerala",
    crowd: 35,
    rating: 4.8,
    cost: 300,
    time: "Open",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85",
    type: "Nature",
    description:
      "Relax among Kerala's backwaters, houseboats and peaceful landscapes."
  }
];

const revenue = [
  { m: "Jan", v: 62 },
  { m: "Feb", v: 70 },
  { m: "Mar", v: 66 },
  { m: "Apr", v: 79 },
  { m: "May", v: 74 },
  { m: "Jun", v: 88 },
  { m: "Jul", v: 96 },
  { m: "Aug", v: 108 }
];

const demoMetrics = {
  tourists: "12.8M",
  tourismRevenue: "₹842 Cr",
  localRevenue: "₹128 Cr",
  redirections: "1.84M"
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeDestination(item, index = 0) {
  const fallback = destinations[index % destinations.length];

  return {
    id: item.id || item.destination_id || fallback.id,
    name: item.name || item.destination_name || fallback.name,
    place:
      item.location ||
      item.city ||
      item.place ||
      fallback.place,
    crowd: Number(
      item.crowd ??
      item.crowd_percentage ??
      item.crowd_level ??
      fallback.crowd
    ),
    rating: Number(item.rating ?? fallback.rating),
    cost: Number(
      item.entry_fee ??
      item.cost ??
      item.price ??
      fallback.cost
    ),
    time: item.status || item.time || "Open",
    img:
      item.image_url ||
      item.image ||
      item.img ||
      fallback.img,
    type:
      item.type ||
      item.category ||
      item.destination_type ||
      fallback.type,
    description:
      item.description ||
      fallback.description
  };
}

function getCrowdFromRow(row) {
  if (!row) return null;

  const keys = [
    "crowd",
    "crowd_percentage",
    "crowd_level",
    "occupancy",
    "percentage",
    "crowd_score"
  ];

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const value = Number(row[key]);
      if (!Number.isNaN(value)) return value;
    }
  }

  return null;
}

async function loadVoyageDestinations() {
  if (!supabase) return destinations;

  try {
    const { data, error } = await supabase
      .from("destinations")
      .select("*");

    if (error || !data || data.length === 0) {
      console.warn("VOYAGE destinations fallback:", error);
      return destinations;
    }

    let result = data.map((x, i) => normalizeDestination(x, i));

    /* Try to attach crowd-intelligence data */
    try {
      const crowdResult = await supabase
        .from("crowd_intelligence")
        .select("*");

      if (!crowdResult.error && crowdResult.data) {
        result = result.map((destination) => {
          const match = crowdResult.data.find((row) => {
            const rowId =
              row.destination_id ||
              row.destination ||
              row.dest_id;

            return (
              rowId === destination.id ||
              String(rowId) === String(destination.id) ||
              String(row.name || "").toLowerCase() ===
                destination.name.toLowerCase()
            );
          });

          const crowd = getCrowdFromRow(match);

          return crowd !== null
            ? { ...destination, crowd }
            : destination;
        });
      }
    } catch (e) {
      console.warn("Crowd data unavailable.");
    }

    return result;
  } catch (e) {
    console.warn("Supabase unavailable. Using demo data.");
    return destinations;
  }
}

function saveTrip(trip) {
  const oldTrips = JSON.parse(
    localStorage.getItem("voyage_trips") || "[]"
  );

  const newTrip = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...trip
  };

  localStorage.setItem(
    "voyage_trips",
    JSON.stringify([newTrip, ...oldTrips])
  );

  return newTrip;
}

function getTrips() {
  return JSON.parse(
    localStorage.getItem("voyage_trips") || "[]"
  );
}

/* =========================================================
   CROWD
========================================================= */

function Crowd({ value }) {
  const level =
    value > 70 ? "High" :
    value > 40 ? "Moderate" :
    "Low";

  return (
    <span
      className={
        "crowd " +
        (value > 70 ? "red" : value > 40 ? "yellow" : "green")
      }
    >
      <span className="crowd-dot"></span>
      {value}% {level}
    </span>
  );
}

/* =========================================================
   LAYOUT
========================================================= */

function Layout({ children, board = false }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const links = board
    ? [
        ["/board", "Overview", BarChart3],
        ["/board/crowd", "Crowd Intelligence", Users],
        ["/board/redirections", "Redirections", Route],
        ["/board/destinations", "Destinations", Compass],
        ["/board/businesses", "Local Businesses", Store],
        ["/board/revenue", "Revenue", IndianRupee]
      ]
    : [
        ["/tourist", "Home", Compass],
        ["/tourist/local", "Explore", MapPin],
        ["/tourist/planner", "AI Planner", Sparkles],
        ["/tourist/trips", "My Trips", Hotel]
      ];

  return (
    <div className="app">
      <header className="header">
        <div
          className="brand"
          onClick={() => nav(board ? "/board" : "/tourist")}
        >
          <div className="logo">V</div>
          <div>
            <b>VOYAGE</b>
            <small>INTELLIGENT TOURISM NETWORK</small>
          </div>
        </div>

        <button
          className="mobile"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "show" : ""}>
          {links.map(([path, title, Icon]) => (
            <button
              key={path}
              className={loc.pathname === path ? "active" : ""}
              onClick={() => {
                nav(path);
                setOpen(false);
              }}
            >
              <Icon size={17} />
              {title}
            </button>
          ))}
        </nav>

        <button
          className="role"
          onClick={() => nav(board ? "/tourist" : "/board")}
        >
          {board ? "Tourist View" : "Tourism Board"}
          <ArrowRight size={16} />
        </button>
      </header>

      <main>{children}</main>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const nav = useNavigate();

  return (
    <Layout>
      <section className="hero">
        <div className="hero-content">
          <div className="live-pill">
            <span></span>
            SMART TOURISM • LIVE INTELLIGENCE
          </div>

          <p className="eyebrow">TRAVEL DIFFERENTLY</p>

          <h1>
            DON'T FOLLOW
            <br />
            <span>THE CROWD.</span>
          </h1>

          <p className="hero-subtitle">
            Discover extraordinary places before everyone else does.
            VOYAGE combines crowd intelligence, local discovery and
            AI trip planning to create smarter journeys.
          </p>

          <div className="actions">
            <button
              className="primary"
              onClick={() => nav("/tourist/local")}
            >
              Explore smarter
              <ArrowRight size={19} />
            </button>

            <button
              className="secondary"
              onClick={() => nav("/tourist/planner")}
            >
              <Sparkles size={17} />
              Build my trip
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>92%</strong>
              <span>crowd detected</span>
            </div>
            <div>
              <strong>28%</strong>
              <span>less-crowded options</span>
            </div>
            <div>
              <strong>15 min</strong>
              <span>average redirection</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src={destinations[3].img}
            alt="Hidden destination"
          />

          <div className="hero-overlay"></div>

          <div className="floating-card top-card">
            <div className="icon-circle">
              <Navigation size={18} />
            </div>
            <div>
              <b>Smart suggestion</b>
              <span>12 min from you</span>
            </div>
          </div>

          <div className="floating-card bottom-card">
            <div className="mini-status">
              <span></span>
              LIVE
            </div>
            <b>Ananthagiri Hills</b>
            <div className="card-row">
              <Crowd value={22} />
              <span>★ 4.5</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div>
          <ShieldCheck size={20} />
          Verified destinations
        </div>
        <div>
          <Zap size={20} />
          Real-time intelligence
        </div>
        <div>
          <MapPin size={20} />
          Local experiences
        </div>
        <div>
          <Sparkles size={20} />
          AI-powered planning
        </div>
      </section>

      <section className="discover-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DISCOVER DIFFERENT</p>
            <h2>
              What kind of experience
              <br />
              are you looking for?
            </h2>
          </div>

          <button
            className="text-button"
            onClick={() => nav("/tourist/local")}
          >
            View all
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="experience-grid">
          <Experience
            icon={Mountain}
            title="Nature escapes"
            text="Find peaceful places away from the rush."
            image={destinations[3].img}
            onClick={() => nav("/tourist/local")}
          />

          <Experience
            icon={Camera}
            title="Hidden heritage"
            text="Experience history beyond the famous landmarks."
            image={destinations[1].img}
            onClick={() => nav("/tourist/local")}
          />

          <Experience
            icon={Utensils}
            title="Local flavours"
            text="Discover food, markets and authentic experiences."
            image={destinations[0].img}
            onClick={() => nav("/tourist/local")}
          />

          <Experience
            icon={Heart}
            title="Slow travel"
            text="Less rushing. More memorable moments."
            image={destinations[5].img}
            onClick={() => nav("/tourist/local")}
          />
        </div>
      </section>

      <section className="smart-section">
        <div className="smart-image">
          <img
            src={destinations[1].img}
            alt="Paigah Tombs"
          />
          <div className="smart-badge">
            <Sparkles size={18} />
            AI RECOMMENDED
          </div>
        </div>

        <div className="smart-content">
          <p className="eyebrow">THE VOYAGE DIFFERENCE</p>

          <h2>
            Your destination
            <br />
            should adapt to you.
          </h2>

          <p>
            Instead of simply showing you the most popular places,
            VOYAGE understands crowd levels, travel time, cost,
            ratings and local opportunities to recommend the
            experience that fits you best.
          </p>

          <div className="smart-points">
            <div>
              <div className="point-icon"><Users /></div>
              <div>
                <b>Beat the crowds</b>
                <span>Find quieter alternatives in real time.</span>
              </div>
            </div>

            <div>
              <div className="point-icon"><Store /></div>
              <div>
                <b>Support local</b>
                <span>Discover businesses beyond tourist hotspots.</span>
              </div>
            </div>

            <div>
              <div className="point-icon"><Route /></div>
              <div>
                <b>Travel smarter</b>
                <span>Build efficient routes around your interests.</span>
              </div>
            </div>
          </div>

          <button
            className="primary"
            onClick={() => nav("/tourist/planner")}
          >
            Try AI Planner
            <Sparkles size={18} />
          </button>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-mark">“</div>
        <h2>
          YOUR NEXT FAVOURITE
          <br />
          DESTINATION MAY BE
          <br />
          JUST 15 MINUTES AWAY.
        </h2>
        <span>VOYAGE • INTELLIGENT TOURISM NETWORK</span>
      </section>
    </Layout>
  );
}

/* =========================================================
   EXPERIENCE
========================================================= */

function Experience({ icon: Icon, title, text, image, onClick }) {
  return (
    <div className="experience-card" onClick={onClick}>
      <img src={image} alt={title} />
      <div className="experience-overlay"></div>

      <div className="experience-content">
        <Icon size={25} />
        <h3>{title}</h3>
        <p>{text}</p>
        <span>
          Explore
          <ArrowRight size={16} />
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   EXPLORE
========================================================= */

function Local() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [liveDestinations, setLiveDestinations] = useState(destinations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoyageDestinations()
      .then(setLiveDestinations)
      .finally(() => setLoading(false));
  }, []);

  const filtered = liveDestinations.filter((d) =>
    `${d.name} ${d.place} ${d.type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="pagehead">
        <div>
          <p className="eyebrow">DISCOVER NEAR YOU</p>
          <h1>Explore smarter.</h1>
          <p>
            Find places worth visiting without following everyone else.
          </p>
        </div>

        <div className="search">
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations, food, stays..."
          />
        </div>
      </div>

      <div className="locationbar">
        <MapPin />
        <b>Hyderabad, Telangana</b>
        <span>• Smart location active</span>
      </div>

      <section className="content-grid">
        <div className="map">
          <div className="mapgrid">
            <div className="maplabel">VOYAGE LIVE MAP</div>

            <div className="map-center">
              <MapPin size={22} />
              YOU
            </div>

            {liveDestinations.slice(0, 5).map((d, i) => (
              <button
                key={d.id}
                className={"marker m" + i}
                onClick={() => setSelected(d)}
              >
                {d.crowd}%
              </button>
            ))}
          </div>

          <div className="maplegend">
            <i className="green-dot" />
            Low
            <i className="yellow-dot" />
            Moderate
            <i className="red-dot" />
            High
          </div>
        </div>

        <div className="cards">
          <div className="cards-heading">
            <div>
              <h2>Recommended for you</h2>
              <span>
                {loading
                  ? "Connecting to live intelligence..."
                  : "Based on crowd + experience"}
              </span>
            </div>
            <Sparkles size={22} />
          </div>

          {filtered.slice(0, 5).map((d) => (
            <DestinationCard
              key={String(d.id)}
              d={d}
              click={() => setSelected(d)}
            />
          ))}

          {!loading && filtered.length === 0 && (
            <p className="muted">No destinations found.</p>
          )}
        </div>
      </section>

      {selected && (
        <RedirectModal
          d={selected}
          close={() => setSelected(null)}
          nav={nav}
          allDestinations={liveDestinations}
        />
      )}
    </Layout>
  );
}

/* =========================================================
   DESTINATION CARD
========================================================= */

function DestinationCard({ d, click }) {
  return (
    <div className="dest" onClick={click}>
      <img src={d.img} alt={d.name} />

      <div className="destbody">
        <div className="row">
          <h3>{d.name}</h3>
          <Crowd value={d.crowd} />
        </div>

        <p>{d.place} • {d.type}</p>

        <div className="meta">
          <span>
            <Star size={15} />
            {d.rating}
          </span>

          <span>
            <IndianRupee size={14} />
            {d.cost}
          </span>

          <span>
            <Clock size={14} />
            12 min
          </span>
        </div>

        <span className="verified">
          <ShieldCheck size={14} />
          Verified destination
        </span>
      </div>

      <ChevronRight className="dest-arrow" size={20} />
    </div>
  );
}

/* =========================================================
   SMART REDIRECTION
========================================================= */

function RedirectModal({ d, close, nav, allDestinations }) {
  const alternatives = allDestinations
    .filter((x) => String(x.id) !== String(d.id))
    .sort((a, b) => a.crowd - b.crowd);

  const alt = alternatives[0] || destinations[1];

  const saving = Math.max(0, d.crowd - alt.crowd);

  function chooseAlternative() {
    saveTrip({
      destination: alt.name,
      type: "Smart Redirection",
      crowd: alt.crowd
    });

    close();
    nav("/tourist/destination/" + alt.id);
  }

  return (
    <div className="overlay">
      <div className="modal">
        <button className="close" onClick={close}>×</button>

        <div className="modal-ai">
          <Sparkles size={17} />
          VOYAGE SMART REDIRECTION
        </div>

        <h2>
          We found a better
          <br />
          experience for you.
        </h2>

        <p className="modal-sub">
          This destination is busy. VOYAGE found a quieter
          alternative with less crowd pressure.
        </p>

        <div className="compare">
          <div>
            <img src={d.img} alt={d.name} />
            <b>{d.name}</b>
            <Crowd value={d.crowd} />
          </div>

          <div className="arrowbig">
            <ArrowRight />
          </div>

          <div>
            <img src={alt.img} alt={alt.name} />
            <b>{alt.name}</b>
            <Crowd value={alt.crowd} />
          </div>
        </div>

        <div className="saving">
          <strong>{saving}% LESS CROWD</strong>
          <span>
            Similar experience • 18 min • ₹50
          </span>
        </div>

        <p className="muted">
          Less crowd. More experience. More opportunity
          for local tourism businesses.
        </p>

        <div className="actions">
          <button className="primary" onClick={chooseAlternative}>
            Explore this instead
            <ArrowRight size={17} />
          </button>

          <button className="secondary" onClick={close}>
            Keep my original plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AI PLANNER
========================================================= */

function Planner() {
  const [days, setDays] = useState(3);
  const [destination, setDestination] = useState("Hyderabad, India");
  const [budget, setBudget] = useState("₹10,000");
  const [experience, setExperience] = useState("Heritage");
  const [done, setDone] = useState(false);

  const itinerary = [
    "Charminar & Old City",
    "Paigah Tombs + local cuisine",
    "Golconda Fort & sunset",
    "Ananthagiri Hills escape",
    "Local markets & hidden cafés",
    "Heritage walk + cultural experience",
    "Relaxed final day"
  ];

  function generate() {
    setDone(true);

    saveTrip({
      destination,
      days,
      budget,
      experience,
      type: "AI Planned Trip"
    });
  }

  return (
    <Layout>
      <div className="planner">
        <div className="planner-intro">
          <div className="ai-orb">
            <Sparkles />
          </div>

          <p className="eyebrow">VOYAGE AI PLANNER</p>

          <h1>
            Don't plan a trip.
            <br />
            <span>Design an experience.</span>
          </h1>

          <p>
            Tell us where you're going, what you love and how much
            you want to spend. VOYAGE creates a crowd-aware journey.
          </p>
        </div>

        <div className="plannerbox">
          <label>
            <span>Destination</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>

          <label>
            <span>Days</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </label>

          <label>
            <span>Budget</span>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>

          <label>
            <span>Experience</span>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option>Heritage</option>
              <option>Nature</option>
              <option>Food</option>
              <option>Family</option>
              <option>Adventure</option>
            </select>
          </label>

          <button
            className="primary generate"
            onClick={generate}
          >
            <Sparkles size={18} />
            Generate my journey
          </button>
        </div>

        {done && (
          <div className="itinerary">
            <div className="itinerary-head">
              <div>
                <p className="eyebrow">AI GENERATED</p>
                <h2>Your {days}-day smart itinerary</h2>
              </div>

              <div className="ai-score">
                <Sparkles size={16} />
                94% optimized
              </div>
            </div>

            {itinerary.slice(0, days).map((item, i) => (
              <div className="day" key={item}>
                <div className="day-number">
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className="day-content">
                  <span>DAY {i + 1}</span>
                  <h3>{item}</h3>
                  <p>
                    09:00 Explore • 13:00 Local lunch •
                    16:00 Hidden gem • 19:00 Experience
                  </p>
                </div>

                <Crowd value={i === 0 ? 42 : 28} />
              </div>
            ))}

            <button
              className="primary"
              onClick={() => {
                alert("Your trip has been saved to My Trips.");
              }}
            >
              <Heart size={17} />
              Save my journey
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* =========================================================
   DESTINATION DETAIL
========================================================= */

function Destination({ id }) {
  const nav = useNavigate();
  const [all, setAll] = useState(destinations);

  useEffect(() => {
    loadVoyageDestinations().then(setAll);
  }, []);

  const d =
    all.find((x) => String(x.id) === String(id)) ||
    all.find((x) => x.name.toLowerCase() === String(id).toLowerCase()) ||
    destinations[0];

  const alternative =
    all
      .filter((x) => String(x.id) !== String(d.id))
      .sort((a, b) => a.crowd - b.crowd)[0] ||
    destinations[1];

  return (
    <Layout>
      <div className="detailhero">
        <img src={d.img} alt={d.name} />

        <div className="detail-content">
          <p className="eyebrow">
            {d.type} • {d.place}
          </p>

          <h1>{d.name}</h1>

          <div className="detail-rating">
            ★ {d.rating}
            <span>Verified destination</span>
            <span>{d.time}</span>
          </div>

          <Crowd value={d.crowd} />

          <p className="detail-description">
            {d.description}
          </p>

          <div className="actions">
            <button
              className="primary"
              onClick={() => nav("/tourist/planner")}
            >
              <CalendarDays size={17} />
              Plan this destination
            </button>

            <button
              className="secondary"
              onClick={() =>
                nav("/tourist/destination/" + alternative.id)
              }
            >
              <Route size={17} />
              Find quieter option
            </button>
          </div>
        </div>
      </div>

      <section className="detailgrid">
        <div>
          <p className="eyebrow">WHY VISIT</p>

          <h2>
            More than a place.
            <br />
            It's an experience.
          </h2>

          <p>
            VOYAGE combines crowd intelligence, travel time,
            cost, ratings and nearby businesses to help you
            make a smarter decision about where to go.
          </p>
        </div>

        <div className="statbox">
          <div>
            <Clock />
            <b>Best time</b>
            <span>08:00 – 11:00</span>
          </div>

          <div>
            <IndianRupee />
            <b>Entry</b>
            <span>₹{d.cost}</span>
          </div>

          <div>
            <Store />
            <b>Nearby businesses</b>
            <span>17 local partners</span>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/* =========================================================
   MY TRIPS
========================================================= */

function Trips() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  function clearTrips() {
    localStorage.removeItem("voyage_trips");
    setTrips([]);
  }

  return (
    <Layout>
      <div className="pagehead">
        <div>
          <p className="eyebrow">YOUR JOURNEYS</p>
          <h1>My Trips</h1>
          <p>Your saved VOYAGE experiences.</p>
        </div>
      </div>

      <section className="cards">
        {trips.length === 0 ? (
          <div className="panel">
            <h2>No trips saved yet.</h2>
            <p>
              Use the AI Planner or Smart Redirection to create
              your first journey.
            </p>
          </div>
        ) : (
          <>
            {trips.map((trip) => (
              <div className="dest" key={trip.id}>
                <div className="destbody">
                  <div className="row">
                    <h3>{trip.destination}</h3>
                    <span className="verified">
                      <ShieldCheck size={14} />
                      Saved
                    </span>
                  </div>

                  <p>
                    {trip.type}
                    {trip.days ? ` • ${trip.days} days` : ""}
                  </p>

                  {trip.experience && (
                    <div className="meta">
                      <span>✨ {trip.experience}</span>
                      <span>💰 {trip.budget}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button className="secondary" onClick={clearTrips}>
              Clear saved trips
            </button>
          </>
        )}
      </section>
    </Layout>
  );
}

/* =========================================================
   TOURISM BOARD
========================================================= */

function Board() {
  const [dbMetrics, setDbMetrics] = useState(demoMetrics);
  const [boardDestinations, setBoardDestinations] =
    useState(destinations);

  useEffect(() => {
    loadVoyageDestinations().then(setBoardDestinations);

    async function loadMetrics() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("tourism_metrics")
          .select("*")
          .limit(1);

        if (!error && data && data[0]) {
          const row = data[0];

          setDbMetrics({
            tourists:
              row.total_tourists ||
              row.tourists ||
              demoMetrics.tourists,

            tourismRevenue:
              row.tourism_revenue ||
              row.revenue ||
              demoMetrics.tourismRevenue,

            localRevenue:
              row.local_business_revenue ||
              row.local_revenue ||
              demoMetrics.localRevenue,

            redirections:
              row.smart_redirections ||
              row.redirections ||
              demoMetrics.redirections
          });
        }
      } catch (e) {
        console.warn("Metrics fallback.");
      }
    }

    loadMetrics();
  }, []);

  return (
    <Layout board>
      <div className="boardhead">
        <div>
          <p className="eyebrow">
            TOURISM BOARD COMMAND CENTER
          </p>

          <h1>India Tourism Intelligence</h1>

          <p>
            Understand visitor movement, crowd pressure and
            local economic impact.
          </p>
        </div>

        <span className="demo">
          LIVE INTELLIGENCE
        </span>
      </div>

      <div className="kpis">
        <K
          title="TOTAL TOURISTS"
          val={dbMetrics.tourists}
          up="18.4%"
          icon={Users}
        />

        <K
          title="TOURISM REVENUE"
          val={dbMetrics.tourismRevenue}
          up="14.7%"
          icon={IndianRupee}
        />

        <K
          title="LOCAL BUSINESS REVENUE"
          val={dbMetrics.localRevenue}
          up="22.8%"
          icon={Store}
        />

        <K
          title="SMART REDIRECTIONS"
          val={dbMetrics.redirections}
          up="31.5%"
          icon={Route}
        />
      </div>

      <section className="dashboardgrid">
        <div className="panel chart">
          <div className="paneltitle">
            <div>
              <h2>Tourism Revenue</h2>
              <span>Monthly performance</span>
            </div>
            <TrendingUp />
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenue}>
              <XAxis dataKey="m" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="v"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="paneltitle">
            <div>
              <h2>Crowd Intelligence</h2>
              <span>Destination pressure</span>
            </div>
            <Users />
          </div>

          <div className="crowdmap">
            {boardDestinations.slice(0, 5).map((d) => (
              <div className="crowdrow" key={String(d.id)}>
                <span>{d.name}</span>
                <Crowd value={d.crowd} />
                <b>
                  {d.crowd > 70
                    ? "High alert"
                    : d.crowd > 40
                    ? "Monitor"
                    : "Opportunity"}
                </b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="impact">
        <div>
          <p className="eyebrow">SIGNATURE METRIC</p>

          <h2>
            Redirecting tourists creates local economic growth.
          </h2>

          <p>
            Tourist → AI recommendation → hidden destination →
            local stay → restaurant → shopping → local revenue
            → economic growth.
          </p>
        </div>

        <div className="flow">
          {[
            "Tourist",
            "AI",
            "Hidden Gem",
            "Local Stay",
            "Local Spend",
            "Growth"
          ].map((x, i) => (
            <React.Fragment key={x}>
              <span>{x}</span>
              {i < 5 && <ArrowRight size={18} />}
            </React.Fragment>
          ))}
        </div>
      </section>
    </Layout>
  );
}

/* =========================================================
   KPI
========================================================= */

function K({ title, val, up, icon: Icon }) {
  return (
    <div className="kpi">
      <Icon />
      <small>{title}</small>
      <strong>{val}</strong>
      <span>
        <TrendingUp size={14} />
        {up}
      </span>
    </div>
  );
}

/* =========================================================
   BOARD INNER PAGES
========================================================= */

function BoardPage({ type }) {
  const [items, setItems] = useState(destinations);

  useEffect(() => {
    loadVoyageDestinations().then(setItems);
  }, []);

  const lower = type.toLowerCase();

  return (
    <Layout board>
      <div className="boardhead">
        <div>
          <p className="eyebrow">ANALYTICS MODULE</p>
          <h1>{type}</h1>
          <p>Strategic tourism intelligence</p>
        </div>
      </div>

      <div className="kpis">
        <K
          title="VISITORS"
          val="4.82M"
          up="12.2%"
          icon={Users}
        />
        <K
          title="REVENUE"
          val="₹214 Cr"
          up="16.4%"
          icon={IndianRupee}
        />
        <K
          title="LOCAL SPEND"
          val="₹48 Cr"
          up="21.1%"
          icon={Store}
        />
        <K
          title="SATISFACTION"
          val="4.7/5"
          up="8.2%"
          icon={Star}
        />
      </div>

      {lower.includes("crowd") && (
        <div className="panel bigpanel">
          <h2>Live destination crowd</h2>

          <div className="crowdmap">
            {items.map((d) => (
              <div className="crowdrow" key={String(d.id)}>
                <span>{d.name}</span>
                <Crowd value={d.crowd} />
                <b>
                  {d.crowd > 70
                    ? "High alert"
                    : d.crowd > 40
                    ? "Monitor"
                    : "Opportunity"}
                </b>
              </div>
            ))}
          </div>
        </div>
      )}

      {lower.includes("destination") && (
        <div className="cards">
          {items.map((d) => (
            <DestinationCard
              key={String(d.id)}
              d={d}
              click={() => {}}
            />
          ))}
        </div>
      )}

      {lower.includes("business") && (
        <div className="panel bigpanel">
          <h2>Local Business Network</h2>
          <p>
            Restaurants, hotels, guides, handicrafts and
            tourism partners connected to the VOYAGE ecosystem.
          </p>

          {[
            "Heritage restaurants",
            "Local hotels & homestays",
            "Certified tour guides",
            "Handicraft stores",
            "Local transport partners"
          ].map((x) => (
            <div className="crowdrow" key={x}>
              <span>{x}</span>
              <b>Active partners</b>
              <span>Verified</span>
            </div>
          ))}
        </div>
      )}

      {lower.includes("redirection") && (
        <div className="panel bigpanel">
          <h2>Smart Redirection Performance</h2>

          <div className="flow">
            <span>Crowded destination</span>
            <ArrowRight size={18} />
            <span>VOYAGE AI</span>
            <ArrowRight size={18} />
            <span>Hidden destination</span>
            <ArrowRight size={18} />
            <span>Local spending</span>
          </div>
        </div>
      )}

      {lower.includes("revenue") && (
        <div className="panel bigpanel">
          <h2>Revenue performance</h2>

          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={revenue}>
              <XAxis dataKey="m" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="v" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!lower.includes("crowd") &&
        !lower.includes("destination") &&
        !lower.includes("business") &&
        !lower.includes("redirection") &&
        !lower.includes("revenue") && (
          <div className="panel bigpanel">
            <h2>Performance overview</h2>

            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={revenue}>
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="v" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
    </Layout>
  );
}

/* =========================================================
   ROUTER
========================================================= */

function App() {
  const p = window.location.pathname;

  if (p === "/" || p === "/tourist" || p === "/tourist/") {
    return <Home />;
  }

  if (p === "/tourist/local") {
    return <Local />;
  }

  if (p === "/tourist/planner") {
    return <Planner />;
  }

  if (p === "/tourist/trips") {
    return <Trips />;
  }

  if (p.startsWith("/tourist/destination/")) {
    return (
      <Destination
        id={decodeURIComponent(p.split("/").pop())}
      />
    );
  }

  if (p.startsWith("/board")) {
    if (p === "/board" || p === "/board/") {
      return <Board />;
    }

    return (
      <BoardPage
        type={
          p
            .split("/")[2]
            ?.replaceAll("-", " ")
            .toUpperCase() || "ANALYTICS"
        }
      />
    );
  }

  return <Home />;
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
