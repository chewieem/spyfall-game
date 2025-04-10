import { Location } from '../types';

// Spyfall için Türkçe harita verileri
export const locations: Location[] = [
  {
    id: 'random',
    name: 'Rastgele',
    description: 'Rastgele bir harita seçilir'
  },
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

// Rastgele harita seçme fonksiyonu
export const getRandomLocation = (): Location => {
  // Rastgele seçeneğini hariç tutarak rastgele bir harita seç
  const filteredLocations = locations.filter(loc => loc.id !== 'random');
  const randomIndex = Math.floor(Math.random() * filteredLocations.length);
  return filteredLocations[randomIndex];
};
