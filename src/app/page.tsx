"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Player, GameScreen } from "./types";

export default function Home() {
  // State for managing screens
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("main");
  const [playerName, setPlayerName] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");
  const [gameTime, setGameTime] = useState<number>(8);
  const [locationPack, setLocationPack] = useState<string>("standard");
  
  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [location, setLocation] = useState<string>("");
  const [spy, setSpy] = useState<Player | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Location data
  const standardLocations = [
    'Airplane', 'Bank', 'Beach', 'Casino', 'Circus', 
    'Corporate Party', 'Crusader Army', 'Day Spa', 
    'Embassy', 'Hospital', 'Hotel', 'Military Base', 
    'Movie Studio', 'Ocean Liner', 'Passenger Train', 
    'Pirate Ship', 'Polar Station', 'Police Station', 
    'Restaurant', 'School', 'Service Station', 
    'Space Station', 'Submarine', 'Supermarket', 
    'Theater', 'University', 'World War II Squad'
  ];
  
  const extendedLocations = [
    ...standardLocations,
    'Amusement Park', 'Art Museum', 'Candy Factory',
    'Cat Show', 'Cemetery', 'Coal Mine', 'Construction Site',
    'Gaming Convention', 'Gas Station', 'Harbor Docks',
    'Ice Hockey Stadium', 'Jail', 'Jazz Club',
    'Library', 'Night Club', 'Race Track',
    'Retirement Home', 'Rock Concert', 'Sightseeing Bus',
    'Stadium', 'Subway', 'The U.N.',
    'Vineyard', 'Wedding', 'Zoo'
  ];

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Generate a random game code
  const generateGameCode = (): string => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  // Create a new game
  const handleCreateGame = () => {
    if (!playerName) {
      alert('Lütfen isminizi girin');
      return;
    }
    
    const newGameCode = generateGameCode();
    setGameCode(newGameCode);
    
    const host: Player = { id: 1, name: playerName, isHost: true };
    setPlayers([host]);
    setCurrentPlayer(host);
    
    setCurrentScreen("waiting");
  };

  // Join an existing game
  const handleJoinGame = () => {
    if (!playerName || !gameCode) {
      alert('Lütfen isminizi ve oyun kodunu girin');
      return;
    }
    
    // In a real app, we would verify the game code with a server
    // For demo purposes, we'll simulate joining
    const playerId = Math.floor(Math.random() * 1000) + 2;
    const newPlayer: Player = { id: playerId, name: playerName, isHost: false };
    
    setPlayers(prev => [...prev, newPlayer]);
    setCurrentPlayer(newPlayer);
    setCurrentScreen("waiting");
  };

  // Start a new round
  const startNewRound = () => {
    if (players.length < 3) {
      alert('Oyuna başlamak için en az 3 oyuncu gereklidir');
      return;
    }
    
    // Select a random location
    const locations = locationPack === 'standard' ? standardLocations : extendedLocations;
    const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
    setLocation(selectedLocation);
    
    // Select a random spy
    const spyIndex = Math.floor(Math.random() * players.length);
    setSpy(players[spyIndex]);
    
    // Set up timer
    setTimeRemaining(gameTime * 60); // Convert to seconds
    startTimer();
    
    setCurrentScreen("game");
  };

  // Start the timer
  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  // End the current round
  const endRound = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    setCurrentScreen("roundEnd");
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add mock players (for demo)
  const addMockPlayers = () => {
    const mockPlayers: Player[] = [
      { id: 101, name: 'Alice', isHost: false },
      { id: 102, name: 'Bob', isHost: false },
      { id: 103, name: 'Charlie', isHost: false },
      { id: 104, name: 'Diana', isHost: false }
    ];
    
    setPlayers(prev => [...prev, ...mockPlayers]);
  };

  // Reset the game
  const resetGame = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    setPlayers([]);
    setCurrentPlayer(null);
    setGameCode("");
    setLocation("");
    setSpy(null);
    setTimeRemaining(0);
    setCurrentScreen("main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      backgroundImage: "url('/background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      position: "relative",
      width: "100vw",
      height: "100vh",
      margin: 0,
      padding: 0
    }}>
      {/* Tüm sayfa için karartma katmanı */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 0
      }}></div>
      {/* Ana Menü Ekranı */}
      {currentScreen === "main" && (
        <div className="relative z-10 flex flex-row justify-center w-full" style={{
          position: "relative",
          maxWidth: "1200px",
          padding: "2rem",
          gap: "2rem"
        }}>
          {/* Sol taraf - Kurallar */}
          <div style={{
            flex: "1",
            backgroundColor: "var(--overlay-color)",
            borderRadius: "1rem",
            padding: "2rem",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <h2 style={{ 
              fontSize: "1.8rem", 
              fontWeight: "bold", 
              marginBottom: "1.5rem", 
              color: "var(--primary-color)",
              textAlign: "center"
            }}>Oyun Kuralları</h2>
            
            <div style={{ 
              backgroundColor: "var(--card-background-lighter)", 
              padding: "1.5rem", 
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              color: "var(--text-secondary)",
              lineHeight: "1.6"
            }}>
              <p style={{ marginBottom: "1rem" }}>
                Spyfall, bir oyuncunun casus olduğu ve lokasyonu bilmediği, diğer oyuncuların ise lokasyonu bildiği ancak casusun kim olduğunu bilmediği bir parti oyunudur.
              </p>
              
              <h3 style={{ 
                fontSize: "1.2rem", 
                fontWeight: "bold", 
                marginTop: "1.5rem", 
                marginBottom: "0.75rem", 
                color: "var(--primary-color)" 
              }}>
                Oyun Hazırlığı
              </h3>
              <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                <li style={{ marginBottom: "0.5rem" }}>Oyun başladığında, rastgele bir oyuncu casus olarak seçilir.</li>
                <li style={{ marginBottom: "0.5rem" }}>Casus dışındaki tüm oyunculara aynı lokasyon gösterilir.</li>
                <li style={{ marginBottom: "0.5rem" }}>Casusa ise sadece casus olduğu bilgisi verilir, lokasyon bilgisi verilmez.</li>
              </ul>
              
              <h3 style={{ 
                fontSize: "1.2rem", 
                fontWeight: "bold", 
                marginTop: "1.5rem", 
                marginBottom: "0.75rem", 
                color: "var(--primary-color)" 
              }}>
                Nasıl Oynanır
              </h3>
              <ol style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                <li style={{ marginBottom: "0.5rem" }}>Oyuncular sırayla birbirlerine lokasyonla ilgili sorular sorarlar.</li>
                <li style={{ marginBottom: "0.5rem" }}>Casus, sorulara verilen cevaplardan lokasyonu tahmin etmeye çalışır.</li>
                <li style={{ marginBottom: "0.5rem" }}>Diğer oyuncular ise, casusun kim olduğunu belirlemeye çalışırlar.</li>
              </ol>
              
              <h3 style={{ 
                fontSize: "1.2rem", 
                fontWeight: "bold", 
                marginTop: "1.5rem", 
                marginBottom: "0.75rem", 
                color: "var(--primary-color)" 
              }}>
                Oyunun Sonu
              </h3>
              <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                <li style={{ marginBottom: "0.5rem" }}><strong>Casus kazanır:</strong> Eğer lokasyonu doğru tahmin ederse.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Diğer oyuncular kazanır:</strong> Eğer casusu doğru tespit ederlerse.</li>
              </ul>
            </div>
          </div>
          
          {/* Sağ taraf - Butonlar */}
          <div style={{
            flex: "1",
            backgroundColor: "var(--overlay-color)",
            borderRadius: "1rem",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "500px"
          }}>
            <h1 className="text-5xl font-bold mb-8 text-center" style={{ 
              color: "var(--text-light)", 
              letterSpacing: "0.5rem",
              textShadow: "0 0 20px rgba(255, 255, 255, 0.3)"
            }}>SPYFALL</h1>
            
            <div className="flex flex-col gap-8 w-full max-w-xs">
              <button 
                onClick={() => setCurrentScreen("create")} 
                style={{
                  backgroundColor: "var(--primary-color)",
                  color: "var(--text-light)",
                  padding: "1.2rem",
                  borderRadius: "0.5rem",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  border: "none",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  marginBottom: "0.5rem",
                  width: "100%"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
              >
                OYUN OLUŞTUR
              </button>
              
              <button 
                onClick={() => setCurrentScreen("join")} 
                style={{
                  backgroundColor: "var(--primary-color)",
                  color: "var(--text-light)",
                  padding: "1.2rem",
                  borderRadius: "0.5rem",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  border: "none",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  marginBottom: "0.5rem",
                  width: "100%"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
              >
                OYUNA KATIL
              </button>
            </div>
            
            <div className="mt-8 text-center" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <p>© {new Date().getFullYear()} Spyfall Game</p>
            </div>
          </div>
        </div>
      )}

      {/* Oyun Oluşturma Ekranı */}
      {currentScreen === "create" && (
        <div className="p-6 rounded-lg" style={{ 
          backgroundColor: "var(--card-background)",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          position: "relative",
          zIndex: 1
        }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "bold", 
            marginBottom: "1.5rem", 
            color: "var(--primary-color)",
            textAlign: "center"
          }}>Oyun Oluştur</h2>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label 
                htmlFor="player-name" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "var(--text-secondary)", 
                  fontSize: "1rem" 
                }}
              >
                Adınız:
              </label>
              <input 
                type="text" 
                id="player-name" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adınızı girin"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--card-background-lighter)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "0.375rem",
                  color: "var(--text-light)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label 
                htmlFor="game-time" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "var(--text-secondary)", 
                  fontSize: "1rem" 
                }}
              >
                Oyun Süresi (dakika):
              </label>
              <input 
                type="number" 
                id="game-time" 
                value={gameTime}
                onChange={(e) => setGameTime(parseInt(e.target.value) || 8)}
                min="5"
                max="15"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--card-background-lighter)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "0.375rem",
                  color: "var(--text-light)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label 
                htmlFor="location-pack" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "var(--text-secondary)", 
                  fontSize: "1rem" 
                }}
              >
                Lokasyon Paketi:
              </label>
              <select 
                id="location-pack" 
                value={locationPack}
                onChange={(e) => setLocationPack(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--card-background-lighter)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "0.375rem",
                  color: "var(--text-light)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              >
                <option value="standard">Standart Lokasyonlar</option>
                <option value="extended">Genişletilmiş Paket</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
            <button 
              onClick={() => setCurrentScreen("main")} 
              style={{
                backgroundColor: "var(--secondary-color)",
                color: "var(--text-light)",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                border: "none",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--secondary-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--secondary-color)"}
            >
              Geri
            </button>
            
            <button 
              onClick={handleCreateGame} 
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--text-light)",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                border: "none",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
            >
              Oyun Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Oyuna Katılma Ekranı */}
      {currentScreen === "join" && (
        <div className="p-6 rounded-lg" style={{ 
          backgroundColor: "var(--card-background)",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          position: "relative",
          zIndex: 1
        }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "bold", 
            marginBottom: "1.5rem", 
            color: "var(--primary-color)",
            textAlign: "center"
          }}>Oyuna Katıl</h2>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label 
                htmlFor="join-name" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "var(--text-secondary)", 
                  fontSize: "1rem" 
                }}
              >
                Adınız:
              </label>
              <input 
                type="text" 
                id="join-name" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adınızı girin"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--card-background-lighter)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "0.375rem",
                  color: "var(--text-light)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label 
                htmlFor="game-code" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "var(--text-secondary)", 
                  fontSize: "1rem" 
                }}
              >
                Oyun Kodu:
              </label>
              <input 
                type="text" 
                id="game-code" 
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Oyun kodunu girin"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--card-background-lighter)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "0.375rem",
                  color: "var(--text-light)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                  textTransform: "uppercase",
                  letterSpacing: "0.2rem"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              />
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
            <button 
              onClick={() => setCurrentScreen("main")} 
              style={{
                backgroundColor: "var(--secondary-color)",
                color: "var(--text-light)",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                border: "none",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--secondary-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--secondary-color)"}
            >
              Geri
            </button>
            
            <button 
              onClick={handleJoinGame} 
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--text-light)",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                border: "none",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
            >
              Oyuna Katıl
            </button>
          </div>
        </div>
      )}

      {/* Kurallar Ekranı */}
      {currentScreen === "rules" && (
        <div className="p-6 rounded-lg" style={{ 
          backgroundColor: "var(--card-background)",
          maxWidth: "700px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          position: "relative",
          zIndex: 1,
          maxHeight: "80vh",
          overflowY: "auto"
        }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "bold", 
            marginBottom: "1.5rem", 
            color: "var(--primary-color)",
            textAlign: "center"
          }}>Oyun Kuralları</h2>
          
          <div style={{ 
            backgroundColor: "var(--card-background-lighter)", 
            padding: "1.5rem", 
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            color: "var(--text-secondary)",
            lineHeight: "1.6"
          }}>
            <p style={{ marginBottom: "1rem" }}>
              Spyfall, bir oyuncunun casus olduğu ve lokasyonu bilmediği, diğer oyuncuların ise lokasyonu bildiği ancak casusun kim olduğunu bilmediği bir parti oyunudur.
            </p>
            
            <h3 style={{ 
              fontSize: "1.3rem", 
              fontWeight: "bold", 
              marginTop: "1.5rem", 
              marginBottom: "0.75rem", 
              color: "var(--primary-color)" 
            }}>
              Oyun Hazırlığı
            </h3>
            <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Oyun başladığında, rastgele bir oyuncu casus olarak seçilir.</li>
              <li style={{ marginBottom: "0.5rem" }}>Casus dışındaki tüm oyunculara aynı lokasyon gösterilir.</li>
              <li style={{ marginBottom: "0.5rem" }}>Casusa ise sadece casus olduğu bilgisi verilir, lokasyon bilgisi verilmez.</li>
            </ul>
            
            <h3 style={{ 
              fontSize: "1.3rem", 
              fontWeight: "bold", 
              marginTop: "1.5rem", 
              marginBottom: "0.75rem", 
              color: "var(--primary-color)" 
            }}>
              Nasıl Oynanır
            </h3>
            <ol style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Oyuncular sırayla birbirlerine lokasyonla ilgili sorular sorarlar.</li>
              <li style={{ marginBottom: "0.5rem" }}>Casus, sorulara verilen cevaplardan lokasyonu tahmin etmeye çalışır.</li>
              <li style={{ marginBottom: "0.5rem" }}>Diğer oyuncular ise, casusun kim olduğunu belirlemeye çalışırlar.</li>
              <li style={{ marginBottom: "0.5rem" }}>Oyuncular, lokasyon hakkında çok fazla bilgi vermeden sorular sormalı ve cevaplamalıdır.</li>
              <li style={{ marginBottom: "0.5rem" }}>Casus, normal bir oyuncu gibi davranmalı ve lokasyonu bilmediğini belli etmemelidir.</li>
            </ol>
            
            <h3 style={{ 
              fontSize: "1.3rem", 
              fontWeight: "bold", 
              marginTop: "1.5rem", 
              marginBottom: "0.75rem", 
              color: "var(--primary-color)" 
            }}>
              Oyunun Sonu
            </h3>
            <p style={{ marginBottom: "1rem" }}>
              Oyun aşağıdaki durumlardan biri gerçekleştiğinde sona erer:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}><strong>Zaman dolduğunda:</strong> Tüm oyuncular casus olduğunu düşündükleri kişi için oy kullanır. En çok oy alan kişi casus olarak seçilir.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Casus lokasyonu tahmin ederse:</strong> Casus istediği zaman oyunu durdurabilir ve lokasyonu tahmin edebilir.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Oyuncular casusu suçlarsa:</strong> Herhangi bir oyuncu, bir başka oyuncuyu casus olmakla suçlayabilir. Eğer tüm oyuncular kabul ederse, suçlanan kişi casus olarak seçilir.</li>
            </ul>
            
            <h3 style={{ 
              fontSize: "1.3rem", 
              fontWeight: "bold", 
              marginTop: "1.5rem", 
              marginBottom: "0.75rem", 
              color: "var(--primary-color)" 
            }}>
              Puanlama
            </h3>
            <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}><strong>Casus kazanır:</strong> Eğer casus lokasyonu doğru tahmin ederse veya başka bir oyuncu yanlışlıkla casus olarak seçilirse.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Diğer oyuncular kazanır:</strong> Eğer casusu doğru tespit ederlerse.</li>
            </ul>
            
            <h3 style={{ 
              fontSize: "1.3rem", 
              fontWeight: "bold", 
              marginTop: "1.5rem", 
              marginBottom: "0.75rem", 
              color: "var(--primary-color)" 
            }}>
              İpucu
            </h3>
            <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Casus iseniz, genel sorular sorun ve başkalarının cevaplarından ipucu almaya çalışın.</li>
              <li style={{ marginBottom: "0.5rem" }}>Normal oyuncu iseniz, sorularınızı ve cevaplarınızı dikkatli seçin. Çok açık ipucu verirseniz casus lokasyonu tahmin edebilir.</li>
              <li style={{ marginBottom: "0.5rem" }}>Oyuncuların davranışlarını izleyin. Casus genellikle daha belirsiz cevaplar verir.</li>
            </ul>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
            <button 
              onClick={() => setCurrentScreen("main")} 
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--text-light)",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                border: "none",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
            >
              Ana Menüye Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
