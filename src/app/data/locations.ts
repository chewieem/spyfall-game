import { Location, LocationGroup } from '../types';

// Spyfall için Türkçe harita verileri
export const locations: Location[] = [
  {
    id: 'ucak',
    name: 'Uçak',
    description: 'Yolcu uçağı',
    image: '/locations/ucak.png',
    roles: ['Pilot', 'Yolcu', 'Hostes', 'Hava Korsanı', 'Mühendis', 'Bagaj Görevlisi']
  },
  {
    id: 'banka',
    name: 'Banka',
    description: 'Para ve değerli eşyaların saklandığı yer',
    image: '/locations/banka.png',
    roles: ['Müdür', 'Güvenlik Görevlisi', 'Kasiyer', 'Müşteri', 'Soyguncu', 'Temizlikçi']
  },
  {
    id: 'plaj',
    name: 'Plaj',
    description: 'Kumsal ve deniz kenarı',
    image: '/locations/plaj.png',
    roles: ['Cankurtaran', 'Turist', 'Satıcı', 'Sörf Hocası', 'Fotoğrafçı', 'Balıkçı']
  },
  {
    id: 'kumarhane',
    name: 'Kumarhane',
    description: 'Kumar oyunlarının oynandığı yer',
    image: '/locations/kumarhane.png',
    roles: ['Krupiye', 'Oyuncu', 'Güvenlik Görevlisi', 'Barmen', 'Zengin Müşteri', 'Dolandırıcı']
  },
  {
    id: 'sirk',
    name: 'Sirk',
    description: 'Akrobatlar ve hayvanların gösteriler yaptığı yer',
    image: '/locations/sirk.png',
    roles: ['Palyaço', 'Akrobat', 'Hayvan Eğiticisi', 'Seyirci', 'Jonglör', 'Sirk Müdürü']
  },
  {
    id: 'hastane',
    name: 'Hastane',
    description: 'Hastaların tedavi edildiği yer',
    image: '/locations/hastane.png',
    roles: ['Doktor', 'Hemşire', 'Hasta', 'Cerrah', 'Stajyer', 'Ziyaretçi']
  },
  {
    id: 'otel',
    name: 'Otel',
    description: 'Konaklama tesisi',
    image: '/locations/otel.png',
    roles: ['Resepsiyonist', 'Müşteri', 'Temizlikçi', 'Şef', 'Güvenlik Görevlisi', 'Bellboy']
  },
  {
    id: 'uzay_istasyonu',
    name: 'Uzay İstasyonu',
    description: 'Uzayda bulunan araştırma istasyonu',
    image: '/locations/uzay_istasyonu.png',
    roles: ['Astronot', 'Bilim İnsanı', 'Turist', 'Mühendis', 'Uzaylı', 'Doktor']
  }
];

// Harita grupları
export const locationGroups: LocationGroup[] = [
  {
    id: 'random',
    name: 'Rastgele',
    description: 'Tüm haritalardan rastgele seçim',
    image: '/locations/random.png',
    locations: ['ucak', 'banka', 'plaj', 'kumarhane', 'sirk', 'hastane', 'otel', 'uzay_istasyonu']
  },
  {
    id: 'group1',
    name: 'Ulaşım ve Finans',
    description: 'Ulaşım ve finans ile ilgili haritalar',
    image: '/location-groups/group1.png',
    locations: ['ucak', 'banka']
  },
  {
    id: 'group2',
    name: 'Eğlence ve Dinlence',
    description: 'Eğlence ve dinlence ile ilgili haritalar',
    image: '/location-groups/group2.png',
    locations: ['plaj', 'kumarhane']
  },
  {
    id: 'group3',
    name: 'Gösteri ve Sağlık',
    description: 'Gösteri ve sağlık ile ilgili haritalar',
    image: '/location-groups/group3.png',
    locations: ['sirk', 'hastane']
  },
  {
    id: 'group4',
    name: 'Konaklama ve Keşif',
    description: 'Konaklama ve keşif ile ilgili haritalar',
    image: '/location-groups/group4.png',
    locations: ['otel', 'uzay_istasyonu']
  }
];

// Grup ID'sine göre rastgele bir harita seçme fonksiyonu
export const getRandomLocationFromGroup = (groupId: string): Location => {
  const group = locationGroups.find(g => g.id === groupId);
  if (!group) {
    // Eğer grup bulunamazsa, tüm haritalardan rastgele bir tane seç
    return getRandomLocation();
  }
  
  // Gruptaki harita ID'lerinden rastgele bir tane seç
  const randomLocationId = group.locations[Math.floor(Math.random() * group.locations.length)];
  
  // Seçilen ID'ye sahip haritayı bul
  const selectedLocation = locations.find(loc => loc.id === randomLocationId);
  
  // Harita bulunamazsa (olmaması gerekir ama güvenlik için), tüm haritalardan rastgele bir tane seç
  return selectedLocation || getRandomLocation();
};

// Rastgele harita seçme fonksiyonu
export const getRandomLocation = (): Location => {
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
};

// Grup ID'sine göre grup bilgisini getiren fonksiyon
export const getLocationGroup = (groupId: string): LocationGroup | undefined => {
  return locationGroups.find(group => group.id === groupId);
};
