"use client";

import { useState, useEffect } from "react";
import { Location, Player, LocationGroup, GameState } from "./types";
import RoomService from "./services/roomService";
import { locations, locationGroups, getRandomLocationFromGroup, getLocationGroup } from "./data/locations";
import LobbyScreen from "./components/lobby/LobbyScreen";
import GameScreen from "./components/game/GameScreen";
import { pusherClient } from './utils/pusherClient';

// Ekran tipleri
type ScreenType = "main" | "create" | "join" | "rules" | "location-select" | "lobby" | "game";

// İstemci tarafında oda bilgilerini saklayacak bir değişken ekleyin (tüm page.tsx dışında)
const clientRooms: Record<string, any> = {};

export default function Home() {
  // Ekran yönetimi için state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("main");
  
  // Oyun oluşturma ekranı için state
  const [playerName, setPlayerName] = useState<string>("");
  const [playerId, setPlayerId] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(8);
  const [selectedLocationGroup, setSelectedLocationGroup] = useState<LocationGroup | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Oyuna katılma ekranı için state
  const [joinCode, setJoinCode] = useState<string>("");
  
  // Lobi ekranı için state
  const [gameCode, setGameCode] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  
  // Oyun ekranı için state
  const [playerRole, setPlayerRole] = useState<string>("");
  const [isSpy, setIsSpy] = useState<boolean>(false);
  
  // Ekran geçişleri için fonksiyonlar
  const goToMainScreen = () => setCurrentScreen("main");
  const goToCreateScreen = () => setCurrentScreen("create");
  const goToJoinScreen = () => setCurrentScreen("join");
  const goToRulesScreen = () => setCurrentScreen("rules");
  const goToLocationSelectScreen = () => setCurrentScreen("location-select");
  const goToLobbyScreen = () => setCurrentScreen("lobby");
  const goToGameScreen = () => setCurrentScreen("game");

  // Oyun oluşturma fonksiyonu
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Lütfen bir isim girin');
      return;
    }

    const newPlayerId = Math.floor(Math.random() * 10000);
    const hostPlayer: Player = {
      id: newPlayerId,
      name: playerName,
      isHost: true
    };

    const result = await RoomService.createRoom(hostPlayer);
    if (result.success && result.roomCode) {
      // State'leri güncelle
      setGameCode(result.roomCode);
      setPlayerId(newPlayerId);
      setPlayers([hostPlayer]);
      setIsHost(true);
      
      // Lobi ekranına geç
      goToLobbyScreen();
      
      // rooms nesnesine client tarafında da kaydet
      clientRooms[result.roomCode] = {
        players: [hostPlayer],
        gameCode: result.roomCode,
        location: '',
        spy: null,
        timeRemaining: 0,
        selectedLocations: []
      };
    } else {
      alert('Oda oluşturulurken bir hata oluştu');
    }
  };

  // Oyuna katılma fonksiyonu
  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      alert('Lütfen bir isim girin');
      return;
    }

    if (!joinCode.trim()) {
      alert('Lütfen oyun kodunu girin');
      return;
    }

    const newPlayerId = Math.floor(Math.random() * 10000);
    const newPlayer: Player = {
      id: newPlayerId,
      name: playerName,
      isHost: false
    };

    const result = await RoomService.joinRoom(joinCode, newPlayer);
    if (result.success && result.gameState) {
      // State'leri güncelle
      setGameCode(joinCode);
      setPlayerId(newPlayerId);
      setPlayers(result.gameState.players);
      setIsHost(false);
      
      // Lobi ekranına geç
      goToLobbyScreen();
      
      // rooms nesnesine client tarafında da kaydet
      clientRooms[joinCode] = result.gameState;
    } else {
      alert(result.error || 'Oda bulunamadı veya dolu');
    }
  };

  // Lokasyon grubu seçimi için fonksiyon
  const handleLocationGroupSelect = (group: LocationGroup) => {
    setSelectedLocationGroup(group);
    
    // Grup içinden rastgele bir harita seç
    const randomLocation = getRandomLocationFromGroup(group.id);
    setSelectedLocation(randomLocation);
    
    setCurrentScreen("create");
  };
  
  // Oyun başlatma işlemi
  const handleStartGame = () => {
    if (!isHost || !gameCode) return;
    
    try {
      // Rastgele bir harita seç
      const randomIndex = Math.floor(Math.random() * locations.length);
      const randomLocation = locations[randomIndex];
      
      // Rastgele bir casus seç
      const randomPlayerIndex = Math.floor(Math.random() * players.length);
      const spy = players[randomPlayerIndex];
      
      // Rolleri dağıt
      let availableRoles = [...(randomLocation.roles || [])];
      
      // Yeterli rol yoksa varsayılan roller ekle
      while (availableRoles.length < players.length - 1) {
        availableRoles.push(`Ziyaretçi ${availableRoles.length + 1}`);
      }
      
      // Rolleri karıştır
      availableRoles = availableRoles.sort(() => Math.random() - 0.5);
      
      // Her oyuncuya bir rol ata (casus dışında)
      const playerRoles: Record<number, string> = {};
      let roleIndex = 0;
      
      players.forEach(player => {
        // Casus değilse rol ata
        if (player.id !== spy.id) {
          playerRoles[player.id] = availableRoles[roleIndex];
          roleIndex++;
        } else {
          playerRoles[player.id] = "Casus";
        }
      });
      
      // İstemci durumunu güncelle
      setSelectedLocation(randomLocation);
      setIsSpy(playerId === spy.id);
      setPlayerRole(playerRoles[playerId] || "Bilinmiyor");
      
      // Oyun başlangıç saatini hesapla
      const gameStartTime = Date.now();
      
      // İstemci tarafındaki diğer oyunculara bildirmek için bildirim gönder
      fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: gameCode,
          event: 'game-started',
          data: {
            gameState: {
              players: players,
              spy: spy,
              location: randomLocation.name,
              selectedLocations: [randomLocation],
              playerRoles: playerRoles,
              gameTime: gameTime,
              gameStartTime: gameStartTime
            }
          }
        })
      }).catch(err => console.error("Bildirim gönderme hatası:", err));
      
      // Oyun ekranına geç
      goToGameScreen();
      
    } catch (error) {
      console.error('Oyun başlatma hatası:', error);
      alert('Oyun başlatılırken bir hata oluştu');
    }
  };

  // Odadan ayrılma işlevi
  const handleLeaveRoom = async () => {
    if (playerId && gameCode) {
      await RoomService.leaveRoom(gameCode, playerId);
    }
    goToMainScreen();
  };

  // Lobiye dönme işlevi ekleyin
  const handleReturnToLobby = () => {
    // Oyun verilerini sıfırla ama oyuncu ve oda bilgilerini koru
    setSelectedLocation(null);
    setPlayerRole("");
    setIsSpy(false);
    
    // Lobi ekranına geç
    goToLobbyScreen();
  };

  // Pusher ile gerçek zamanlı veri dinlemesi
  useEffect(() => {
    if (currentScreen !== "lobby" || !gameCode) return;
    
    const channel = pusherClient.subscribe(`room-${gameCode}`);
    
    channel.bind('player-joined', (data: { gameState: GameState }) => {
      setPlayers(data.gameState.players);
    });
    
    channel.bind('player-left', (data: { gameState: GameState }) => {
      setPlayers(data.gameState.players);
    });
    
    channel.bind('game-started', (data: { gameState: GameState }) => {
      // Oyun başladığında
      const iAmSpy = data.gameState.spy?.id === playerId;
      setIsSpy(iAmSpy);
      
      // Player role'ü ayarla
      if (data.gameState.playerRoles && playerId) {
        setPlayerRole(data.gameState.playerRoles[playerId] || "Bilinmiyor");
      } else {
        setPlayerRole(iAmSpy ? "Casus" : "Normal Oyuncu");
      }
      
      setSelectedLocation(data.gameState.selectedLocations[0]);
      
      // Diğer oyun verilerini al
      if (data.gameState.gameTime) {
        setGameTime(data.gameState.gameTime);
      }
      
      // Oyun ekranına geç
      goToGameScreen();
    });
    
    return () => {
      pusherClient.unsubscribe(`room-${gameCode}`);
    };
  }, [currentScreen, gameCode, playerId]);

  return (
    <div style={{ 
      backgroundImage: "url('/arkaplan.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      position: "relative",
      width: "100vw",
      height: "100vh",
      margin: 0,
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Karartma katmanı */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 0
      }} />
      
      {/* İçerik alanı */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "inline-block",
        textAlign: "center"
      }}>
        {/* Ana Menü Ekranı */}
        {currentScreen === "main" && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem"
          }}>
            <h1 style={{ 
              color: "white", 
              fontSize: "3rem", 
              fontWeight: "bold",
              marginBottom: "3rem",
              letterSpacing: "0.5rem",
              textShadow: "0 0 10px rgba(0, 0, 255, 0.5)"
            }}>
              CASUS KİM?
            </h1>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              width: "100%",
              maxWidth: "300px"
            }}>
              <button 
                onClick={goToCreateScreen} 
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "1rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
              >
                OYUN OLUŞTUR
              </button>
              
              <button 
                onClick={goToJoinScreen} 
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "1rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
              >
                OYUNA KATIL
              </button>
              
              <button 
                onClick={goToRulesScreen} 
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "1rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
              >
                KURALLAR
              </button>
            </div>
            
            <div style={{ marginTop: "3rem", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem" }}>
              <p> {new Date().getFullYear()} Spyfall Game</p>
            </div>
          </div>
        )}

        {/* Oyun Oluşturma Ekranı */}
        {currentScreen === "create" && (
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ 
              color: "#3498db", 
              fontSize: "2rem", 
              fontWeight: "bold",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              Oyun Oluştur
            </h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                htmlFor="player-name" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "#ccc", 
                  fontSize: "1rem",
                  textAlign: "left"
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
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #3498db",
                  borderRadius: "0.5rem",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                htmlFor="game-time" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "#ccc", 
                  fontSize: "1rem",
                  textAlign: "left"
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
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #3498db",
                  borderRadius: "0.5rem",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>
            
            {/* Harita seçim seçeneği gizlendi, otomatik olarak rastgele seçiliyor */}
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
              <button 
                onClick={goToMainScreen} 
                style={{
                  backgroundColor: "#7f8c8d",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#95a5a6"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#7f8c8d"}
              >
                Geri
              </button>
              
              <button 
                onClick={handleCreateGame} 
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  marginLeft: "2.5rem"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
              >
                Oyun Oluştur
              </button>
            </div>
          </div>
        )}

        {/* Oyuna Katılma Ekranı */}
        {currentScreen === "join" && (
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ 
              color: "#3498db", 
              fontSize: "2rem", 
              fontWeight: "bold",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              Oyuna Katıl
            </h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                htmlFor="join-name" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "#ccc", 
                  fontSize: "1rem",
                  textAlign: "left"
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
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #3498db",
                  borderRadius: "0.5rem",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                htmlFor="join-code" 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  color: "#ccc", 
                  fontSize: "1rem",
                  textAlign: "left"
                }}
              >
                Oyun Kodu:
              </label>
              <input 
                type="text" 
                id="join-code" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Oyun kodunu girin"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid #3498db",
                  borderRadius: "0.5rem",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.2rem"
                }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
              <button 
                onClick={goToMainScreen} 
                style={{
                  backgroundColor: "#7f8c8d",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#95a5a6"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#7f8c8d"}
              >
                Geri
              </button>
              
              <button 
                onClick={handleJoinGame} 
                style={{
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  marginLeft: "2.5rem"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
              >
                Oyuna Katıl
              </button>
            </div>
          </div>
        )}

        {/* Lokasyon Grubu Seçim Ekranı */}
        {currentScreen === "location-select" && (
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            width: "95%",
            maxWidth: "1000px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h2 style={{ color: "#3498db", marginBottom: "1.5rem" }}>Harita Grubu Seçin</h2>
            
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "2rem",
              maxHeight: "70vh",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#3498db rgba(255, 255, 255, 0.1)",
              msOverflowStyle: "none",
              padding: "0.5rem"
            }}>
              <style jsx global>{`
                ::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                ::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb {
                  background: #3498db;
                  border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: #2980b9;
                }
              `}</style>
              
              {locationGroups.map(group => {
                // Gruptaki haritaları bul
                const groupLocations = locations.filter(loc => 
                  group.locations.includes(loc.id)
                );
                
                return (
                  <div 
                    key={group.id}
                    onClick={() => handleLocationGroupSelect(group)}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      border: "2px solid rgba(52, 152, 219, 0.5)",
                      marginBottom: "0.5rem",
                      backgroundColor: group.id === 'random' ? "rgba(255, 215, 0, 0.1)" : "rgba(0, 0, 0, 0.3)",
                      padding: "0.35rem",
                      width: "100%"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
                      e.currentTarget.style.border = "2px solid #3498db";
                      e.currentTarget.style.backgroundColor = group.id === 'random' ? "rgba(255, 215, 0, 0.2)" : "rgba(0, 0, 0, 0.4)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.border = "2px solid rgba(52, 152, 219, 0.5)";
                      e.currentTarget.style.backgroundColor = group.id === 'random' ? "rgba(255, 215, 0, 0.1)" : "rgba(0, 0, 0, 0.3)";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      width: "100%",
                      height: "100%"
                    }}>
                      {/* Grup İsmi */}
                      <div style={{
                        width: "150px",
                        minWidth: "150px",
                        backgroundColor: group.id === 'random' ? "rgba(255, 215, 0, 0.3)" : "rgba(52, 152, 219, 0.3)",
                        padding: "0.35rem",
                        borderRadius: "0.25rem",
                        marginRight: "0.75rem"
                      }}>
                        <h3 style={{
                          margin: 0,
                          color: group.id === 'random' ? "#ffd700" : "#3498db",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          textAlign: "center"
                        }}>
                          {group.name}
                        </h3>
                      </div>
                      
                      {/* Gruba Ait Haritaların Fotoğrafları */}
                      <div style={{
                        display: "flex",
                        gap: "0.5rem",
                        flex: 1,
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        alignItems: "center"
                      }}>
                        {group.id === 'random' ? (
                          // Rastgele seçenek için soru işareti ve açıklama
                          <div style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0.25rem",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "60px",
                              height: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "2.5rem",
                              color: "#ffd700",
                              fontWeight: "bold"
                            }}>
                              ?
                            </div>
                            <div style={{
                              color: "white",
                              fontSize: "0.9rem"
                            }}>
                              Tüm haritalar arasından rastgele bir harita seçilecek
                            </div>
                          </div>
                        ) : (
                          // Normal gruplar için harita listesi
                          groupLocations.map(location => (
                            <div key={location.id} style={{
                              width: "80px",
                              height: "55px",
                              borderRadius: "0.25rem",
                              overflow: "hidden",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              display: "inline-block",
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              margin: "0 2px"
                            }}>
                              <img 
                                src={location.image} 
                                alt={location.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover"
                                }}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setCurrentScreen("create")} 
              style={{
                backgroundColor: "#3498db",
                color: "white",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "bold",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "background-color 0.3s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2980b9"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3498db"}
            >
              Geri Dön
            </button>
          </div>
        )}
        
        {/* Lobi Ekranı */}
        {currentScreen === "lobby" && (
          <LobbyScreen
            gameCode={gameCode}
            players={players}
            isHost={isHost}
            playerName={playerName}
            selectedLocation={selectedLocation || undefined}
            selectedLocationGroup={selectedLocationGroup || undefined}
            onStartGame={handleStartGame}
            onLeaveGame={handleLeaveRoom}
          />
        )}
        
        {/* Oyun Ekranı */}
        {currentScreen === "game" && (
          <GameScreen
            playerName={playerName}
            playerRole={playerRole}
            isSpy={isSpy}
            location={selectedLocation || undefined}
            locationGroup={selectedLocationGroup || undefined}
            gameTime={gameTime}
            roundTime={30}
            onEndGame={() => {
              setIsHost(false);
              goToMainScreen();
            }}
            players={players}
            gameCode={gameCode}
            onReturnToLobby={handleReturnToLobby}
          />
        )}
        
        {/* Kurallar Ekranı */}
        {currentScreen === "rules" && (
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2rem 3rem",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            maxHeight: "70vh",
            overflowY: "auto",
            width: "95%",
            maxWidth: "2200px",
            position: "relative",
            paddingBottom: "1rem", // Buton için alan bırak
            margin: "0 auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#3498db rgba(255, 255, 255, 0.1)",
            msOverflowStyle: "none"
          }}>
            <style jsx global>{`
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb {
                background: #3498db;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #2980b9;
              }
            `}</style>
            <h2 style={{ 
              color: "#3498db", 
              fontSize: "2rem", 
              fontWeight: "bold",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              Oyun Kuralları
            </h2>
            
            <div style={{ 
              backgroundColor: "rgba(255, 255, 255, 0.1)", 
              padding: "1.5rem", 
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              color: "#ccc",
              lineHeight: "1.6",
              textAlign: "left"
            }}>
              <p style={{ marginBottom: "1rem" }}>
                Spyfall, bir oyuncunun casus olduğu ve lokasyonu bilmediği, diğer oyuncuların ise lokasyonu bildiği ancak casusun kim olduğunu bilmediği bir parti oyunudur.
              </p>
              
              <h3 style={{ 
                fontSize: "1.3rem", 
                fontWeight: "bold", 
                marginTop: "1.5rem", 
                marginBottom: "0.75rem", 
                color: "#3498db" 
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
                color: "#3498db" 
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
                color: "#3498db" 
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
            </div>
            
            <button 
              onClick={goToMainScreen} 
              style={{
                position: "fixed",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#3498db",
                color: "white",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "bold",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                zIndex: 100
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#2980b9";
                e.currentTarget.style.transform = "translateX(-50%) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 15px rgba(0, 0, 0, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#3498db";
                e.currentTarget.style.transform = "translateX(-50%) translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.5)";
              }}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Ana Menüye Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
