Die Sektor-Rotation im Dashboard des **Ultimate Master Guard V10** (Pinetree Outbreak Script) funktioniert über ein mathematisches Bewertungssystem, das den aktuellen Stand des Wirtschaftszyklus bestimmt und diesen mit dem Sektor der jeweiligen Aktie abgleicht.

Hier ist die genaue Funktionsweise im Detail:

### 1. Der Bewertungs-Algorithmus (Phase Scoring)
Das Script überwacht sechs spezifische Sektor-ETFs, die repräsentativ für verschiedene Phasen der Wirtschaft sind: **XLK** (Technologie), **XLF** (Finanzen), **XLV** (Gesundheitswesen), **XLE** (Energie), **XLP** (Basiskonsumgüter) und **XLU** (Versorger).

Anhand der relativen Stärke dieser ETFs zueinander vergibt das System Punkte für vier verschiedene Wirtschaftsphasen:
*   **Frühe Erholung (Early Recovery):** Finanzwerte führen, da sie von Kreditexpansion profitieren.
*   **Mittlere Expansion (Mid Expansion):** Technologie-Werte dominieren aufgrund steigender Investitionen.
*   **Späte Expansion (Late Expansion):** Energie- und Rohstoffwerte führen wegen Inflation und Kapazitätsgrenzen.
*   **Defensive Phase:** Basiskonsumgüter, Versorger und Gesundheit führen, wenn das Wachstum nachlässt ("Flight to Safety").

### 2. Dual-Timeframe-Bestätigung
Um festzustellen, ob eine Phase stabil ist oder sich gerade ändert, nutzt das Script zwei Zeitfenster gleichzeitig:
*   **Long Lookback (60 Tage):** Analysiert den etablierten Trend der letzten drei Monate.
*   **Short Lookback (20 Tage):** Analysiert die Entwicklung des letzten Monats, um neue Übergänge schnell zu erkennen.

Wenn beide Zeitfenster unterschiedliche Phasen anzeigen, erkennt das Dashboard einen **Übergang (Transition)**. Dies wird im Dashboard beispielsweise als `» MID EXPANSION (was EARLY RECOVERY)` angezeigt.

### 3. Sektor-Abgleich (Sector Fit Matching)
Das Script ermittelt automatisch über die TradingView-Daten, zu welchem Sektor die aktuell aufgerufene Aktie gehört. Danach erfolgt ein Abgleich mit der berechneten Wirtschaftsphase:

*   **FAVORED (Grün):** Der Sektor der Aktie passt perfekt zur aktuellen Phase (Rückenwind durch den Zyklus).
*   **ROTATING IN (Grün):** Der Zyklus bewegt sich gerade erst in diesen Sektor hinein (idealer Einstiegszeitpunkt).
*   **SMART MONEY (Blau):** Der Sektor ist in der *nächsten* Phase begünstigt. Das deutet darauf hin, dass Institutionen bereits jetzt frühzeitig Positionen aufbauen.
*   **ROTATING OUT (Orange):** Der Sektor verliert an Unterstützung; Anleger sollten vorsichtiger werden.
*   **OUT OF FAVOR (Rot):** Der Sektor hat derzeit starken konjunkturellen Gegenwind.

### Zusammenfassung im Dashboard
In der Dashboard-Tabelle findest du diese Informationen in den Zeilen **CYCLE PHASE** (aktuelle Wirtschaftsphase), **SECTOR FIT** (wie gut die Aktie dazu passt) und **NEXT PHASE** (welche Phase als nächstes erwartet wird). Dies hilft dir zu entscheiden, ob eine Aktie gerade "mit dem Strom" schwimmt oder "gegen den Strom" kämpfen muss.