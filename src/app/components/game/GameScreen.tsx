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
  onReturnToLobby: () => void;
  players: Player[];
  gameCode: string;
}

// Oylama için yeni interface
interface Vote {
  voterId: number;
  suspectId: number;
  voterName: string;
  suspectName: string;
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
  onReturnToLobby,
  players,
  gameCode
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(gameTime * 60);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [showLocationGuess, setShowLocationGuess] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  
  // Oylama sistemi için state'ler
  const [showVoting, setShowVoting] = useState<boolean>(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [spyId, setSpyId] = useState<number | null>(null);
  
  // Oyuncu id'si
  const playerId = players.find(p => p.name === playerName)?.id || 0;
  
  // Spy oyuncusunu bul (bu bilgiyi sadece server bilir, client değil)
  useEffect(() => {
    // Gerçek oyunda spy'ı server'dan alırdık, burada demo olarak isSpy prop'una göre belirleyebiliriz
    if (isSpy) {
      setSpyId(playerId);
    }
  }, [isSpy, playerId]);
  
  // Oyları kontrol et - oy çoğunluğu varsa oyun sonucunu belirle
  useEffect(() => {
    // Tüm oyuncuların en az yarısı oy kullandıysa
    if (votes.length >= Math.ceil(players.length / 2)) {
      // Oyları sayıp en çok oy alan oyuncuyu bul
      const voteCounts = votes.reduce((acc, vote) => {
        acc[vote.suspectId] = (acc[vote.suspectId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // En çok oy alan oyuncuyu bul
      const [suspectId, voteCount] = Object.entries(voteCounts).reduce(
        (max, [id, count]) => (count > max[1] ? [Number(id), count] : max),
        [0, 0]
      );
      
      // Çoğunluk oyunu alan kişiyi kontrol et (oyların yarısından fazlası)
      const majorityThreshold = Math.ceil(votes.length / 2);
      
      if (voteCount >= majorityThreshold) {
        // Doğru kişi seçildi mi (gerçek spy)?
        const spyWasFound = suspectId === spyId;
        
        if (spyWasFound) {
          // Spy bulunduğunda oyunu bitir ve bildirim gönder
          if (gameCode) {
            fetch('/api/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                roomCode: gameCode,
                event: 'voting-result',
                data: {
                  result: "Casus bulundu!",
                  spyWasFound: true,
                  suspectId
                }
              })
            }).catch(err => console.error("Bildirim gönderme hatası:", err));
          }
          
          // Kendi oyun sonucumuzu yerel olarak ayarla
          if (isSpy) {
            setGameResult("Kaybettin! Diğer oyuncular seni buldu.");
          } else {
            setGameResult("Tebrikler! Casusu başarıyla belirlediniz.");
          }
        }
        // Yanlış kişi seçilirse oyun devam eder
      }
    }
  }, [votes, players.length, isSpy, spyId, gameCode]);
  
  // Pusher ile bildirimleri dinle
  useEffect(() => {
    if (!gameCode) return;
    
    // @ts-ignore - Kütüphane global olarak tanımlı
    const pusherClient = window.pusherClient;
    if (!pusherClient) return;
    
    const channel = pusherClient.subscribe(`room-${gameCode}`);
    
    // Casus doğru tahmin ettiğinde
    channel.bind('spy-guessed-correctly', () => {
      if (!isSpy) {
        // Bildirim yerine doğrudan oyun sonucunu ayarla
        setGameResult("Kaybettin! Casus konumunu buldu");
      }
    });
    
    // Casus yanlış tahmin ettiğinde - yeni eklenen olay
    channel.bind('spy-guessed-wrong', (data: { playerName: string, guessedLocationName: string }) => {
      if (!isSpy) {
        // Daha özlü ve net bir mesaj
        setGameResult("Kazandınız! Casus yanlış konumu seçti.");
      }
    });
    
    // Oylama gönderildiğinde
    channel.bind('new-vote', (data: { vote: Vote }) => {
      setVotes(prevVotes => {
        // Aynı kişiden gelen önceki oyu varsa güncelle, yoksa yeni oy ekle
        const filteredVotes = prevVotes.filter(v => v.voterId !== data.vote.voterId);
        return [...filteredVotes, data.vote];
      });
    });
    
    // Oylama sonucu
    channel.bind('voting-result', (data: { result: string, spyWasFound: boolean, suspectId: number }) => {
      if (data.spyWasFound) {
        const iAmSuspect = playerId === data.suspectId;
        
        if (iAmSuspect && isSpy) {
          setGameResult("Kaybettin! Diğer oyuncular seni buldu.");
        } else if (!isSpy) {
          setGameResult("Tebrikler! Casusu başarıyla belirlediniz.");
        } else if (isSpy && !iAmSuspect) {
          setGameResult("Tebrikler! Oyuncular başka birini casus sanıyor.");
        }
      }
    });
    
    // Süre bittiğinde
    channel.bind('time-ended', () => {
      if (!isSpy) {
        setGameResult("Kaybettin! Süre bitti ve casus bulunamadı.");
      } else {
        setGameResult("Tebrikler! Süre bitti ve kimliğin ortaya çıkmadı.");
      }
    });
    
    // Lobiye geri dönme bildirimi - bu kısmı ekleyin
    channel.bind('return-to-lobby', (data: { hostName: string }) => {
      // Host olmayan oyuncular için
      if (playerName !== data.hostName) {
        onReturnToLobby();
      }
    });
    
    // Oyun başladığında
    channel.bind('game-started', (data: { gameState: any }) => {
      if (data.gameState.gameStartTime) {
        setGameStartTime(data.gameState.gameStartTime);
      }
    });
    
    return () => {
      pusherClient.unsubscribe(`room-${gameCode}`);
    };
  }, [gameCode, isSpy, playerId, playerName, onReturnToLobby]);
  
  // Zamanlayıcı için useEffect - senkronize edilmiş
  useEffect(() => {
    // Oyun sonucu varsa zamanlayıcıyı durdur
    if (gameResult) return;
    
    // Oyun toplam süresi (saniye cinsinden)
    const totalGameTime = gameTime * 60;
    
    const timer = setInterval(() => {
      // Şu anki zamanı al
      const now = Date.now();
      
      // Oyun başlangıcından bu yana geçen süre (saniye cinsinden)
      const elapsedSeconds = Math.floor((now - gameStartTime) / 1000);
      
      // Kalan süreyi hesapla
      const remaining = Math.max(0, totalGameTime - elapsedSeconds);
      
      setTimeLeft(remaining);
      
      // Süre bitti mi?
      if (remaining <= 0) {
        clearInterval(timer);
        
        // Host ise süre bittiğinde bildirimi gönder
        const hostPlayer = players.find(player => player.isHost);
        const isPlayerHost = playerName === hostPlayer?.name;
        
        if (isPlayerHost) {
          // Süre bittiğinde bildirimi gönder
          if (gameCode) {
            fetch('/api/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                roomCode: gameCode,
                event: 'time-ended',
                data: {}
              })
            }).catch(err => console.error("Bildirim gönderme hatası:", err));
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameCode, gameTime, gameResult, gameStartTime, playerName, players]);
  
  // Süreyi dakika:saniye formatına çevirme
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Oy gönderme
  const castVote = (suspectId: number) => {
    const suspect = players.find(p => p.id === suspectId);
    if (!suspect) return;
    
    setMyVote(suspectId);
    
    const newVote: Vote = {
      voterId: playerId,
      suspectId,
      voterName: playerName,
      suspectName: suspect.name
    };
    
    // Yerel state'i güncelle
    setVotes(prevVotes => {
      const filteredVotes = prevVotes.filter(v => v.voterId !== playerId);
      return [...filteredVotes, newVote];
    });
    
    // API ile oyu gönder
    if (gameCode) {
      fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: gameCode,
          event: 'new-vote',
          data: { vote: newVote }
        })
      }).catch(err => console.error("Oy gönderme hatası:", err));
    }
    
    setShowVoting(false);
  };
  
  // Lokasyon tahmini değerlendirme
  const handleLocationGuess = (guessedLocation: Location) => {
    if (location && guessedLocation.id === location.id) {
      // Casus doğru tahmin yaptı
      setGameResult("Tebrikler! Doğru lokasyonu buldun. Kazandın!");
      
      // Diğer oyunculara bildirim gönder
      if (gameCode) {
        fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomCode: gameCode,
            event: 'spy-guessed-correctly',
            data: { playerName }
          })
        }).catch(err => console.error("Bildirim gönderme hatası:", err));
      }
    } else {
      // Casus yanlış tahmin yaptı
      setGameResult("Yanlış tahmin! Oyunu kaybettin.");
      
      // Diğer oyunculara bildirim gönder - yanlış tahmin için
      if (gameCode) {
        fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomCode: gameCode,
            event: 'spy-guessed-wrong',
            data: { playerName, guessedLocationName: guessedLocation.name }
          })
        }).catch(err => console.error("Bildirim gönderme hatası:", err));
      }
    }
    setShowLocationGuess(false);
  };
  
  // Oylama ekranı
  const renderVotingScreen = () => {
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
        <h2 style={{ color: "#3498db", marginBottom: "1.5rem" }}>Casus Olduğunu Düşündüğün Oyuncuyu Seç</h2>
        
        <div style={{ 
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          width: "90%",
          maxWidth: "600px"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem"
          }}>
            {players.map((player) => (
              <div 
                key={player.id}
                onClick={() => castVote(player.id)}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  border: myVote === player.id ? "2px solid #e74c3c" : "2px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(52, 152, 219, 0.3)";
                  e.currentTarget.style.borderColor = "#3498db";
                }}
                onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                  e.currentTarget.style.borderColor = myVote === player.id ? "#e74c3c" : "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div style={{
                  backgroundColor: player.name === playerName ? "#3498db" : "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  margin: "0 auto 0.75rem auto"
                }}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <p style={{ color: "white", fontWeight: "bold" }}>
                  {player.name}
                </p>
                {myVote === player.id && (
                  <div style={{ color: "#e74c3c", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                    ✓ Seçildi
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1.5rem"
        }}>
          <button
            onClick={() => setShowVoting(false)}
            style={{
              backgroundColor: "rgba(231, 76, 60, 0.8)",
              color: "white",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer"
            }}
          >
            İptal Et
          </button>
          
          {myVote !== null && (
            <button
              onClick={() => setShowVoting(false)}
              style={{
                backgroundColor: "#2ecc71",
                color: "white",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "bold",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer"
              }}
            >
              Onayla
            </button>
          )}
        </div>
      </div>
    );
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
  
  // Bildirim bileşeni - kullanılmıyor artık, gerekirse kaldırılabilir
  const renderNotification = () => {
    if (!showNotification) return null;
    
    return (
      <div style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(231, 76, 60, 0.9)",
        color: "white",
        padding: "1rem 2rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
        zIndex: 2000,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "1.2rem",
        animation: "fadeIn 0.5s"
      }}>
        {notificationMessage}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
      </div>
    );
  };
  
  // Oyların durumunu gösteren bileşen
  const renderVotesStatus = () => {
    // Casuslar yalnızca kimlerin oy verdiğini görür, kime oy verdiklerini değil
    if (isSpy) {
      const votedPlayerIds = votes.map(v => v.voterId);
      return (
        <div style={{
          marginTop: "1rem",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "0.75rem",
          borderRadius: "0.5rem"
        }}>
          <p style={{ color: "#ccc", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Oy Veren Oyuncular:
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            {players.map(player => (
              <span
                key={player.id}
                style={{
                  backgroundColor: votedPlayerIds.includes(player.id) ? "rgba(46, 204, 113, 0.3)" : "rgba(255, 255, 255, 0.1)",
                  color: votedPlayerIds.includes(player.id) ? "#2ecc71" : "#ccc",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.8rem"
                }}
              >
                {player.name} {votedPlayerIds.includes(player.id) ? "✓" : ""}
              </span>
            ))}
          </div>
        </div>
      );
    }
    
    // Normal oyuncular kimlerin kime oy verdiğini görür
    return (
      <div style={{
        marginTop: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: "0.75rem",
        borderRadius: "0.5rem"
      }}>
        <p style={{ color: "#ccc", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          Oylar:
        </p>
        {votes.length > 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            {votes.map((vote, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.25rem"
                }}
              >
                <span style={{ color: "white" }}>{vote.voterName}</span>
                <span style={{ color: "#ccc" }}>➡</span>
                <span style={{ color: "#f39c12", fontWeight: "bold" }}>{vote.suspectName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.9rem" }}>
            Henüz oy kullanılmadı
          </p>
        )}
      </div>
    );
  };
  
  // Oyun sonucunu gösteren ekran
  const renderGameResult = () => {
    // Oyuncular arasından host olanı bulalım
    const hostPlayer = players.find(player => player.isHost);
    // Mevcut oyuncu host mu kontrolü
    const isPlayerHost = playerName === hostPlayer?.name;

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
        
        <div style={{ 
          display: "flex", 
          gap: "1rem",
          marginTop: "1rem",
          flexDirection: "column",
          alignItems: "center" 
        }}>
          {/* Sadece host'a Lobiye Dön butonu gösterilir */}
          {isPlayerHost ? (
            <>
              <button
                onClick={() => {
                  // Tüm oyuncuları lobiye göndermek için bildirim
                  if (gameCode) {
                    fetch('/api/notify', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        roomCode: gameCode,
                        event: 'return-to-lobby',
                        data: { hostName: playerName }
                      })
                    }).catch(err => console.error("Bildirim gönderme hatası:", err));
                  }
                  
                  // Host için lobi ekranına dönüş
                  onReturnToLobby();
                }}
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
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#2980b9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#3498db";
                }}
              >
                Tüm Oyuncuları Lobiye Gönder
              </button>
              
              <p style={{ color: "#ccc", fontSize: "0.9rem", textAlign: "center", maxWidth: "400px" }}>
                Bu butona tıkladığınızda tüm oyuncular lobiye geri dönecektir.
                Sadece ev sahibi bu butonu görebilir.
              </p>
            </>
          ) : (
            <p style={{ color: "#ccc", fontSize: "0.9rem", textAlign: "center", maxWidth: "400px" }}>
              Oyun sona erdi. Ev sahibinin lobiye dönüş butonuna tıklamasını bekleyin.
            </p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: "2.5rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
      maxWidth: "95%",
      width: "1200px",
      margin: "0 auto"
    }}>
      {/* Sayaçlar */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "2.5rem"
      }}>
        {/* Oyun İçin Belirlenen Süre */}
        <div style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "1.2rem",
          borderRadius: "0.5rem",
          textAlign: "center",
          width: "40%"
        }}>
          <div style={{ color: "#3498db", fontSize: "1rem", marginBottom: "0.5rem" }}>
            Oyun İçin Belirlenen Süre
          </div>
          <div style={{ color: "#3498db", fontSize: "2.5rem", fontWeight: "bold" }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      {/* Ana İçerik - Harita ve Oyuncular Yan Yana */}
      <div style={{
        display: "flex",
        gap: "3rem",
        marginBottom: "2.5rem"
      }}>
        {/* Sol Taraf - Harita Bilgisi ve Rol */}
        <div style={{
          flex: "3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Harita Bilgisi */}
          <div style={{
            width: "100%",
            marginBottom: "2rem"
          }}>
            {/* Harita Resmi */}
            <div style={{
              width: "100%",
              height: "280px",
              backgroundColor: isSpy ? "rgba(0, 0, 0, 0.5)" : "transparent",
              borderRadius: "0.5rem",
              overflow: "hidden",
              marginBottom: "1rem",
              border: isSpy ? "2px solid #e74c3c" : "2px solid #3498db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {isSpy === true ? (
                <div style={{ fontSize: "7rem", color: "#e74c3c" }}>?</div>
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
              padding: "1rem",
              borderRadius: "0.25rem",
              textAlign: "center",
              width: "100%"
            }}>
              {isSpy === true ? (
                <div>
                  <div style={{ color: "#e74c3c", fontWeight: "bold", fontSize: "1.2rem" }}>
                    Casus olduğun için harita bilgisini göremezsin!
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: "white", fontWeight: "bold", fontSize: "1.3rem" }}>
                    {location?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Oyuncu Rolü */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            textAlign: "center",
            width: "100%"
          }}>
            <div style={{ color: "#ccc", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Oyuncunun Rolü
            </div>
            <div style={{ color: "#e74c3c", fontSize: "1.5rem", fontWeight: "bold" }}>
              {isSpy ? "Casus" : playerRole}
            </div>
          </div>
        </div>
        
        {/* Sağ Taraf - Oyuncular Listesi */}
        <div style={{
          flex: "2",
          width: "auto"
        }}>
          <h3 style={{ 
            color: "#3498db", 
            fontSize: "1.4rem", 
            marginBottom: "1rem",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Oyuncular</span>
            <button
              onClick={() => setShowVoting(true)}
              style={{
                backgroundColor: "#e74c3c",
                color: "white",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: "bold",
                border: "none",
                borderRadius: "0.3rem",
                cursor: "pointer"
              }}
            >
              Casus Seç
            </button>
          </h3>
          
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem",
            padding: "0.8rem",
            maxHeight: "350px",
            overflowY: "auto"
          }}>
            {players.map((player, index) => (
              <div key={index} style={{
                padding: "1rem",
                borderBottom: index < players.length - 1 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <span style={{ 
                    backgroundColor: player.name === playerName ? "#3498db" : "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    fontWeight: "bold"
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: player.name === playerName ? "bold" : "normal", fontSize: "1.1rem" }}>
                    {player.name}
                  </span>
                </div>
                
                {player.isHost && (
                  <span style={{ 
                    color: "#f39c12", 
                    fontSize: "0.9rem", 
                    backgroundColor: "rgba(243, 156, 18, 0.2)",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "0.3rem"
                  }}>
                    EV SAHİBİ
                  </span>
                )}
                
                {myVote === player.id && (
                  <span style={{ 
                    color: "#e74c3c", 
                    fontSize: "0.9rem", 
                    backgroundColor: "rgba(231, 76, 60, 0.2)",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "0.3rem"
                  }}>
                    CASUS ✓
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Oylama Durumu */}
          {renderVotesStatus()}
        </div>
      </div>
      
      {/* Alt Butonlar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        marginTop: "1.5rem" 
      }}>
        <button
          onClick={onEndGame}
          style={{
            backgroundColor: "rgba(231, 76, 60, 0.8)",
            color: "white",
            padding: "1rem 2rem",
            fontSize: "1.1rem",
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
        
        {/* Sadece casuslar için gösterilecek */}
        {isSpy && (
          <button
            onClick={() => setShowLocationGuess(true)}
            style={{
              backgroundColor: "#2ecc71",
              color: "white",
              padding: "1rem 2rem",
              fontSize: "1.1rem", 
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
      
      {/* Lokasyon tahmin ekranı */}
      {showLocationGuess && renderLocationGuessScreen()}
      
      {/* Oylama ekranı */}
      {showVoting && renderVotingScreen()}
      
      {/* Oyun sonuç ekranı */}
      {gameResult && renderGameResult()}
    </div>
  );
};

export default GameScreen;
