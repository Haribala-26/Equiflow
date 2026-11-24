"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { useApp } from "@/context/AppContext";
import { CITIES } from "@/domain/config";

function MapController({ selectedCoords }: { selectedCoords: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 14, { duration: 1.2 });
    }
  }, [selectedCoords, map]);

  return null;
}

export default function MapInner() {
  const { areas, selectedAreaId, setSelectedAreaId, currentCity } = useApp();

  const cityConfig = CITIES[currentCity] || CITIES.Chennai;
  const selectedArea = areas.find((a) => a.id === selectedAreaId);
  const selectedCoords: [number, number] | null = selectedArea
    ? [selectedArea.latitude, selectedArea.longitude]
    : null;

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden shadow-inner border border-borderDefault">
      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: "380px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedCoords={selectedCoords} />

        {areas
          .filter((a) => a.active)
          .map((area) => {
            const isSelected = area.id === selectedAreaId;
            const markerColor = area.priority?.categoryColor || "#167D83";
            const score = area.priority?.score?.toFixed(1) ?? "N/A";
            const category = area.priority?.category?.toUpperCase() ?? "MODERATE";

            return (
              <CircleMarker
                key={area.id}
                center={[area.latitude, area.longitude]}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: isSelected ? 0.95 : 0.8,
                  color: isSelected ? "#172B4D" : "#FFFFFF",
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedAreaId(area.id);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs font-sans">
                    <span className="font-bold">{area.name}</span>: Score {score} ({category})
                  </div>
                </Tooltip>

                <Popup>
                  <div className="p-1 max-w-xs font-sans text-slate-800">
                    <div className="flex items-center justify-between border-b pb-1 mb-2">
                      <h4 className="font-bold text-sm text-slate-900">{area.name}</h4>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: markerColor }}
                      >
                        {category} ({score})
                      </span>
                    </div>

                    <div className="text-xs space-y-1 mb-2 text-slate-600">
                      <div>
                        <strong>Population:</strong> {area.population.toLocaleString()} ({area.households} households)
                      </div>
                      <div>
                        <strong>Severity:</strong> {area.severity}/100 | <strong>Urgency:</strong> {area.urgency}/100
                      </div>
                      {area.notes && (
                        <div className="italic text-slate-500 text-[11px] mt-1 bg-slate-50 p-1 rounded">
                          "{area.notes}"
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-1">
                      <div className="text-[11px] font-semibold text-slate-700 mb-1">
                        Resource Needs:
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        {area.needs.map((n) => (
                          <div key={n.resourceType} className="bg-slate-100 px-1 py-0.5 rounded">
                            <span className="capitalize font-medium">{n.resourceType}:</span> {n.requestedQty} {n.unit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAreaId(area.id)}
                      className="mt-2 w-full text-center py-1 bg-teal hover:bg-teal-700 text-white rounded text-xs font-medium"
                    >
                      View Detailed Breakdown
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
