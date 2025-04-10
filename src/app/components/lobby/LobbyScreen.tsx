"use client";

import React, { useState, useEffect } from 'react';
import { Player, Location, LocationGroup } from '../../types';

interface LobbyScreenProps {
  gameCode: string;
  players: Player[];
  isHost: boolean;
  playerName: string;
  selectedLocation?: Location;
  selectedLocationGroup?: LocationGroup;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  gameCode,
  players,
  isHost,
  playerName,
  selectedLocation: _selectedLocation,
  selectedLocationGroup: _selectedLocationGroup,
  onStartGame,
  onLeaveGame
}) => {
  const [countdown] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Oyun kodunu panoya kopyalama
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Kopyalama başarısız oldu:', err);
      });
  };

  // Varsayılan harita bilgisi
  const defaultLocation = {
    id: "random",
    name: "Rastgele Harita",
    image: "/locations/random.png"
  };

  // Harita grubu bilgisi için varsayılan değer - rastgele için
  const _locationGroupToShow = _selectedLocationGroup?.name || "Unknown Group";
  const locationGroupToShow = {
    id: 'random',
    name: 'Rastgele',
    description: 'Tüm haritalardan rastgele seçim yapılacak',
    image: '/location-groups/random.png',
    locations: []
  };

  // Harita gösterimini güncelleyeceğim
  const _locationToShow = _selectedLocation?.name || "Unknown Location";
  const locationToShow = defaultLocation;

  useEffect(() => {
    // isHost durumu değiştiğinde kontrolü burada yapabiliriz
    console.log("Host durumu değişti:", isHost);
  }, [isHost]);

  return (
    <div style={{
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: "2.5rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
      display: "inline-block",
      textAlign: "center"
    }}>
      {/* Oyun Kodu */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "1rem",
        borderRadius: "0.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ color: "white", fontSize: "1.2rem", fontWeight: "bold" }}>
          Oyun Kodu: <span style={{ color: "#3498db" }}>{gameCode}</span>
        </div>
        <button 
          onClick={copyGameCode}
          style={{
            backgroundColor: copySuccess ? "#2ecc71" : "#3498db",
            color: "white",
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.3rem",
            cursor: "pointer",
            transition: "background-color 0.3s"
          }}
        >
          {copySuccess ? "Kopyalandı!" : "Kopyala"}
        </button>
      </div>
      
      {/* Ana İçerik - İki Sütunlu Layout */}
      <div style={{
        display: "flex",
        gap: "4rem",
        marginBottom: "3rem",
        marginTop: "2rem"
      }}>
        {/* Sol Sütun - Harita Bilgisi */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Sadece Rastgele Harita kutusunu göster - Mavi çerçeveli kutu */}
          <div style={{
            width: "300px",
            height: "300px",
            borderRadius: "1rem",
            overflow: "hidden",
            marginBottom: "1.5rem",
            border: "3px solid #3498db",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)"
          }}>
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              textAlign: "center"
            }}>
              <h3 style={{ 
                margin: "0 0 1rem 0", 
                color: "#3498db", 
                fontSize: "1.5rem" 
              }}>
                Rastgele Harita
              </h3>
              <p style={{ 
                margin: "0 0 1.5rem 0", 
                fontSize: "0.9rem", 
                opacity: 0.8 
              }}>
                Oyun başladığında harita gösterilecek
              </p>
              
              {/* Buraya soru işareti görselini ekleyin */}
              <div style={{
                width: "100px",
                height: "100px",
                margin: "0 auto 1rem auto"
              }}>
                <img 
                  src="/locations/random.png"
                  alt="Rastgele Harita"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain"
                  }}
                />
              </div>
              
              <div style={{
                backgroundColor: "rgba(52, 152, 219, 0.2)",
                border: "1px solid #3498db",
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem"
              }}>
                Tüm haritalardan rastgele seçim yapılacak
              </div>
            </div>
          </div>
        </div>
        
        {/* Sağ Sütun - Oyuncu Listesi */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{ 
            color: "#3498db", 
            fontSize: "1.3rem", 
            fontWeight: "bold",
            marginBottom: "1rem",
            textAlign: "left"
          }}>
            Oyuncular
          </h3>
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem",
            height: "350px",
            overflowY: "auto",
            width: "100%",
            minWidth: "350px"
          }}>
            {players.map((player, index) => (
              <div key={index} style={{
                padding: "0.75rem 1rem",
                borderBottom: index < players.length - 1 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center",
                  gap: "0.5rem"
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
                  {player.name}
                </div>
                {player.isHost && (
                  <span style={{ 
                    color: "#f39c12", 
                    fontSize: "0.8rem", 
                    fontWeight: "bold",
                    backgroundColor: "rgba(243, 156, 18, 0.2)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.3rem"
                  }}>
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Butonlar */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        gap: "2rem",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        <button 
          onClick={onLeaveGame}
          style={{
            backgroundColor: "rgba(231, 76, 60, 0.8)",
            color: "white",
            padding: "1rem 2rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "all 0.3s",
            flex: "1"
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
          Odadan Ayrıl
        </button>
        
        {isHost && (
          <button 
            onClick={onStartGame}
            style={{
              backgroundColor: "#2ecc71",
              color: "white",
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "all 0.3s",
              flex: "1"
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
            Oyunu Başlat
          </button>
        )}
      </div>
      
      {countdown !== null && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          borderRadius: "1rem"
        }}>
          <div style={{
            fontSize: "5rem",
            fontWeight: "bold",
            color: "#3498db"
          }}>
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;
