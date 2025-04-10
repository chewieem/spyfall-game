"use client";

import React, { useState, useEffect } from 'react';
import { Location, LocationGroup } from '../../types';
import { Player } from '../../types';
import { locations } from '../../data/locations';

interface GameScreenProps {
  playerName: string;
  playerRole: string;
  isSpy: boolean;
  location?: Location;
  locationGroup?: LocationGroup;
  gameTime: number;
  roundTime: number;
  onEndGame: () => void;
  players: Player[];
}

const GameScreen: React.FC<GameScreenProps> = ({
  playerName,
  playerRole,
  isSpy,
  location,
  locationGroup,
  gameTime,
  roundTime,
  onEndGame,
  players
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(gameTime * 60);
  const [showLocationGuess, setShowLocationGuess] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  
  // Zamanlayıcı için useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameTime]);
  
  // Süreyi dakika:saniye formatına çevirme
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Lokasyon tahmini değerlendirme
  const handleLocationGuess = (guessedLocation: Location) => {
    if (location && guessedLocation.id === location.id) {
      setGameResult("Tebrikler! Doğru lokasyonu buldun. Kazandın!");
    } else {
      setGameResult("Yanlış tahmin! Oyunu kaybettin.");
    }
    setShowLocationGuess(false);
  };
  
  // Lokasyon tahmin ekranı
  const renderLocationGuessScreen = () => {
    // İlk 4 lokasyon üstte, son 4 lokasyon altta olacak şekilde ayırma
    const topLocations = locations.slice(0, 4);
    const bottomLocations = locations.slice(4, 8);
    
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}>
        <h2 style={{ color: "#3498db", marginBottom: "1.5rem" }}>Lokasyonu Tahmin Et</h2>
        
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          gap: "2rem",
          width: "95%",
          maxWidth: "1000px"
        }}>
          {/* Üst Satır */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            width: "100%"
          }}>
            {topLocations.map((loc) => (
              <div 
                key={loc.id}
                onClick={() => handleLocationGuess(loc)}
                style={{
                  width: "220px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                  position: "relative", // Hover efekti için gerekli
                  transition: "transform 0.2s, border-color 0.2s"
                }}
              >
                <div style={{
                  height: "140px",
                  overflow: "hidden",
                  position: "relative" // Hover efekti için gerekli
                }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s",
                      zIndex: 1
                    }}
                    onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = "rgba(52, 152, 219, 0.3)";
                      e.currentTarget.parentElement!.parentElement!.style.borderColor = "#3498db";
                      e.currentTarget.parentElement!.parentElement!.style.transform = "scale(1.03)";
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.parentElement!.parentElement!.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.parentElement!.parentElement!.style.transform = "scale(1)";
                    }}
                  />
                  <img 
                    src={loc.image} 
                    alt={loc.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </div>
                <div style={{
                  padding: "0.75rem",
                  textAlign: "center"
                }}>
                  <p style={{ color: "white", fontWeight: "bold" }}>{loc.name}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Alt Satır */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            width: "100%"
          }}>
            {bottomLocations.map((loc) => (
              <div 
                key={loc.id}
                onClick={() => handleLocationGuess(loc)}
                style={{
                  width: "220px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                  position: "relative", // Hover efekti için gerekli
                  transition: "transform 0.2s, border-color 0.2s"
                }}
              >
                <div style={{
                  height: "140px",
                  overflow: "hidden",
                  position: "relative" // Hover efekti için gerekli
                }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s",
                      zIndex: 1
                    }}
                    onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = "rgba(52, 152, 219, 0.3)";
                      e.currentTarget.parentElement!.parentElement!.style.borderColor = "#3498db";
                      e.currentTarget.parentElement!.parentElement!.style.transform = "scale(1.03)";
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.parentElement!.parentElement!.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.parentElement!.parentElement!.style.transform = "scale(1)";
                    }}
                  />
                  <img 
                    src={loc.image} 
                    alt={loc.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </div>
                <div style={{
                  padding: "0.75rem",
                  textAlign: "center"
                }}>
                  <p style={{ color: "white", fontWeight: "bold" }}>{loc.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => setShowLocationGuess(false)}
          style={{
            backgroundColor: "rgba(231, 76, 60, 0.8)",
            color: "white",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            marginTop: "2rem"
          }}
        >
          İptal Et
        </button>
      </div>
    );
  };
  
  // Oyun sonucunu gösteren ekran
  const renderGameResult = () => {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}>
        <h2 style={{ 
          color: gameResult?.includes("Tebrikler") ? "#2ecc71" : "#e74c3c", 
          fontSize: "2rem",
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          {gameResult}
        </h2>
        
        {location && (
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "2rem"
          }}>
            <p style={{ color: "white", textAlign: "center" }}>
              Gerçek Lokasyon: <strong>{location.name}</strong>
            </p>
          </div>
        )}
        
        <button
          onClick={onEndGame}
          style={{
            backgroundColor: "#3498db",
            color: "white",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}
        >
          Oyunu Bitir
        </button>
      </div>
    );
  };
  
  return (
    <div style={{
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: "2rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
      maxWidth: "90%",
      margin: "0 auto"
    }}>
      {/* Sayaçlar */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "2rem"
      }}>
        {/* Oyun İçin Belirlenen Süre */}
        <div style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "center",
          width: "45%"
        }}>
          <div style={{ color: "#3498db", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Oyun İçin Belirlenen Süre
          </div>
          <div style={{ color: "#3498db", fontSize: "2rem", fontWeight: "bold" }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      {/* Ana İçerik - Harita ve Oyuncular Yan Yana */}
      <div style={{
        display: "flex",
        gap: "2rem",
        marginBottom: "2rem"
      }}>
        {/* Sol Taraf - Harita Bilgisi ve Rol */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "60%"
        }}>
          {/* Harita Bilgisi */}
          <div style={{
            width: "100%",
            marginBottom: "1.5rem"
          }}>
            {/* Harita Resmi */}
            <div style={{
              width: "100%",
              height: "200px",
              backgroundColor: isSpy ? "rgba(0, 0, 0, 0.5)" : "transparent",
              borderRadius: "0.5rem",
              overflow: "hidden",
              marginBottom: "0.5rem",
              border: isSpy ? "2px solid #e74c3c" : "2px solid #3498db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {isSpy === true ? (
                <div style={{ fontSize: "5rem", color: "#e74c3c" }}>?</div>
              ) : (
                <img 
                  src={location?.image} 
                  alt={location?.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              )}
            </div>

            {/* Harita Bilgileri */}
            <div style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "0.75rem",
              borderRadius: "0.25rem",
              textAlign: "center",
              width: "100%"
            }}>
              {isSpy === true ? (
                <div>
                  <div style={{ color: "#e74c3c", fontWeight: "bold" }}>
                    Casus olduğun için harita bilgisini göremezsin!
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: "white", fontWeight: "bold", fontSize: "1.1rem" }}>
                    {location?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Oyuncu Rolü */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "1rem",
            borderRadius: "0.5rem",
            textAlign: "center",
            width: "100%"
          }}>
            <div style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              Oyuncunun Rolü
            </div>
            <div style={{ color: "#e74c3c", fontSize: "1.2rem", fontWeight: "bold" }}>
              {isSpy ? "Casus" : playerRole}
            </div>
          </div>
        </div>
        
        {/* Sağ Taraf - Oyuncular Listesi */}
        <div style={{
          flex: "1",
          width: "40%"
        }}>
          <h3 style={{ 
            color: "#3498db", 
            fontSize: "1.2rem", 
            marginBottom: "0.75rem",
            textAlign: "left"
          }}>
            Oyuncular
          </h3>
          
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            maxHeight: "300px",
            overflowY: "auto"
          }}>
            {players.map((player, index) => (
              <div key={index} style={{
                padding: "0.75rem",
                borderBottom: index < players.length - 1 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ 
                    backgroundColor: player.name === playerName ? "#3498db" : "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    fontWeight: "bold"
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  {player.name === playerName ? (
                    <strong>{player.name} (Sen)</strong>
                  ) : (
                    <span>{player.name}</span>
                  )}
                </div>
                
                {player.isHost && (
                  <span style={{ 
                    color: "#f39c12", 
                    fontSize: "0.8rem", 
                    backgroundColor: "rgba(243, 156, 18, 0.2)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.3rem"
                  }}>
                    EV SAHİBİ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Alt Butonlar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        marginTop: "1rem"
      }}>
        <button
          onClick={onEndGame}
          style={{
            backgroundColor: "rgba(231, 76, 60, 0.8)",
            color: "white",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(231, 76, 60, 1)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(231, 76, 60, 0.8)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Oyundan Çık
        </button>
        
        <button
          onClick={() => isSpy && setShowLocationGuess(true)}
          style={{
            backgroundColor: "#2ecc71",
            color: "white",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#27ae60";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#2ecc71";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Lokasyonu Tahmin Et
        </button>
      </div>
      
      {/* Lokasyon tahmin ekranı */}
      {showLocationGuess && renderLocationGuessScreen()}
      
      {/* Oyun sonuç ekranı */}
      {gameResult && renderGameResult()}
    </div>
  );
};

export default GameScreen;
