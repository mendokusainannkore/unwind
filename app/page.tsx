'use client'

import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline,
  Polygon,
  useMap
} from 'react-leaflet'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

const floodZone: [number, number][] = [
  [35.6385, 139.6900],
  [35.6425, 139.6940],
  [35.6395, 139.7000],
  [35.6355, 139.6960]
]

const fireRiskZone: [number, number][] = [
  [35.6280, 139.7050],
  [35.6320, 139.7100],
  [35.6290, 139.7160],
  [35.6240, 139.7120]
]

const shelters = [
  {
    name: '目黒区役所',
    position: [35.6415, 139.6982] as [number, number]
  },
  {
    name: '碑文谷公園',
    position: [35.6261, 139.6885] as [number, number]
  },
  {
    name: '林試の森公園',
    position: [35.6332, 139.7150] as [number, number]
  }
]

const dailySpots = [
  {
    name: 'スターバックス 中目黒',
    position: [35.6442, 139.6982] as [number, number]
  },
  {
    name: '目黒川',
    position: [35.6410, 139.7035] as [number, number]
  },
  {
    name: '渋谷スクランブル',
    position: [35.6595, 139.7005] as [number, number]
  }
]

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], 14)
  }, [lat, lng, map])

  return null
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  return Math.sqrt(
    Math.pow(lat2 - lat1, 2) +
    Math.pow(lng2 - lng1, 2)
  )
}

export default function Home() {
  const [position, setPosition] = useState<[number, number] | null>(null)

  const [crowdLevels, setCrowdLevels] = useState(
    shelters.map(() => Math.floor(Math.random() * 3))
  )

  const [mode, setMode] = useState<'disaster' | 'daily'>('disaster')

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([
        pos.coords.latitude,
        pos.coords.longitude
      ])
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCrowdLevels(
        shelters.map(() => Math.floor(Math.random() * 3))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getColor = (level: number) => {
    if (level === 0) return 'green'
    if (level === 1) return 'yellow'
    return 'red'
  }

  const getStatus = (level: number) => {
    if (level === 0) return '空いています'
    if (level === 1) return 'やや混雑'
    return '満員'
  }

  const nearestShelter = position
    ? shelters.reduce((prev, current) => {
        const prevDistance = calculateDistance(
          position[0],
          position[1],
          prev.position[0],
          prev.position[1]
        )

        const currentDistance = calculateDistance(
          position[0],
          position[1],
          current.position[0],
          current.position[1]
        )

        return currentDistance < prevDistance ? current : prev
      })
    : null

  const spots = mode === 'disaster' ? shelters : dailySpots

  return (
    <main className="h-screen w-full relative">

      {/* UIパネル */}
      <div className="absolute top-4 left-4 z-[1000] bg-black/80 text-white p-4 rounded-2xl">
        <h1 className="text-xl font-bold">SEINAI</h1>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setMode('disaster')}
            className={`px-3 py-1 rounded ${
              mode === 'disaster' ? 'bg-red-500' : 'bg-white/10'
            }`}
          >
            防災
          </button>

          <button
            onClick={() => setMode('daily')}
            className={`px-3 py-1 rounded ${
              mode === 'daily' ? 'bg-cyan-500' : 'bg-white/10'
            }`}
          >
            日常
          </button>
        </div>

        {nearestShelter && (
          <p className="text-sm mt-2">
            最寄り: {nearestShelter.name}
          </p>
        )}
      </div>

      {/* 地図 */}
      <MapContainer
        center={[35.6415, 139.6982]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* リスクゾーン */}
        <Polygon positions={floodZone} pathOptions={{ color: 'red', fillOpacity: 0.3 }}>
          <Popup>浸水リスク</Popup>
        </Polygon>

        <Polygon positions={fireRiskZone} pathOptions={{ color: 'orange', fillOpacity: 0.3 }}>
          <Popup>火災リスク</Popup>
        </Polygon>

        {/* 現在地 */}
        {position && (
          <>
            <RecenterMap lat={position[0]} lng={position[1]} />

            <Marker position={position} icon={userIcon}>
              <Popup>現在地</Popup>
            </Marker>

            {nearestShelter && (
              <Polyline
                positions={[position, nearestShelter.position]}
                pathOptions={{ color: 'cyan', weight: 4 }}
              />
            )}
          </>
        )}

        {/* スポット */}
        {spots.map((spot, i) => (
          <CircleMarker
            key={spot.name}
            center={spot.position}
            radius={12}
            pathOptions={{
              color: getColor(crowdLevels[i % crowdLevels.length]),
              fillColor: getColor(crowdLevels[i % crowdLevels.length]),
              fillOpacity: 0.8
            }}
          >
            <Popup>
              <b>{spot.name}</b>
              <br />
              {getStatus(crowdLevels[i % crowdLevels.length])}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </main>
  )
}