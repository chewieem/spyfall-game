"use client";

import React, { useState, useEffect } from 'react';
import { Location, LocationGroup } from '../../types';

interface GameScreenProps {
  playerName: string;
  playerRole: string;
  isSpy: boolean;
  location?: Location;
  locationGroup?: LocationGroup;
  gameTime: number;
  roundTime: number;
  onEndGame: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  playerName,
  playerRole,
  isSpy,
  location,
  locationGroup,
  gameTime,
  roundTime,
  onEndGame
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(gameTime * 60);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(roundTime);
  
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
      
      setRoundTimeLeft(prevTime => {
        if (prevTime <= 1) {
          // Round süresi dolduğunda, round süresini yeniden başlat
          return roundTime;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameTime, roundTime]);
  
  // Süreyi dakika:saniye formatına çevirme
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <div style={{
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: "2rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
      width: "100%",
      maxWidth: "800px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2rem"
    }}>
      {/* Üst Bilgi Alanı */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        width: "100%",
        gap: "1rem"
      }}>
        {/* Oyuncu Round Süresi */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <div style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Oyuncu Round Süresi
          </div>
          <div style={{ color: "#3498db", fontSize: "1.5rem", fontWeight: "bold" }}>
            {formatTime(roundTimeLeft)}
          </div>
        </div>
        
        {/* Oyuncu Adı ve Icon */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: "50%", 
            backgroundColor: "#3498db",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.2rem",
            marginBottom: "0.5rem"
          }}>
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div style={{ color: "white", fontWeight: "bold" }}>
            {playerName}
          </div>
        </div>
        
        {/* Oyun İçin Belirlenen Süre */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <div style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Oyun İçin Belirlenen Süre
          </div>
          <div style={{ color: "#3498db", fontSize: "1.5rem", fontWeight: "bold" }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      {/* Orta Alan - Harita ve Rol Bilgisi */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "400px"
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
        
        {/* Oyuncunun Rolü */}
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
      
      {/* Alt Butonlar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "400px",
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
        
        {isSpy && (
          <button
            onClick={() => alert("Lokasyonu tahmin etme özelliği henüz eklenmedi.")}
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
        )}
      </div>
    </div>
  );
};

export default GameScreen;
