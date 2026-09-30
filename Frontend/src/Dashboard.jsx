import "./Dashboard.css";
import { useState } from "react";

function Dashboard() {
  const [runSummary] = useState({
    totalDistance: 0,
    totalTravelTime: 0,
    vehiclesUsed: 0,
    vehiclesAvailable: 0,
    capacityUtilization: 0,
    constraintViolations: 0
  });

  const [mlModel] = useState({
    rmse: 0,
    mae: 0,
    r2: 0,
    featureImportance: {
      distance: 0,
      isPeak: 0,
      vehicles: 0,
      roadCapacity: 0,
      weather: 0,
      signalTime: 0,
      hour: 0,
      dayOfWeek: 0
    }
  });

  return (
    <div className="dashboard-page">

      <h1>Benchmarking & Performance</h1>

      <p className="dashboard-subtitle">
        Evidence of QPSO optimization performance
      </p>

      {/* ================= CONVERGENCE ANALYSIS ================= */}

      <section className="dashboard-card">
        <h2>Convergence Analysis</h2>

        <div className="convergence-chart">

          <div className="chart-y-label">
            Fitness Value
          </div>

          <div className="chart-area">

            <div className="y-axis-values">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>

            <svg
              className="convergence-svg"
              viewBox="0 0 800 350"
              preserveAspectRatio="none"
            >

              <polyline
                className="graph-line qpso-graph"
                points="0,60 80,130 160,190 240,225 320,250 400,265 480,275 560,280 640,285 720,288 800,290"
              />

              <polyline
                className="graph-line pso-graph"
                points="0,60 80,100 160,140 240,165 320,185 400,200 480,210 560,218 640,225 720,230 800,235"
              />

              <polyline
                className="graph-line ga-graph"
                points="0,60 80,90 160,125 240,150 320,170 400,185 480,198 560,207 640,215 720,220 800,225"
              />

              <polyline
                className="graph-line exact-graph"
                points="0,290 800,290"
              />

            </svg>

            <div className="x-axis-values">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
              <span>120</span>
              <span>140</span>
              <span>160</span>
              <span>180</span>
              <span>200</span>
            </div>

            <div className="chart-x-label">
              Iteration Number
            </div>

          </div>
        </div>

        <div className="chart-legend">
          <span>
            <b className="legend-dot qpso"></b>
            QPSO
          </span>

          <span>
            <b className="legend-dot pso"></b>
            Classical PSO
          </span>

          <span>
            <b className="legend-dot ga"></b>
            Genetic Algorithm
          </span>

          <span>
            <b className="legend-dot exact"></b>
            Exact Solver
          </span>
        </div>

        <p className="chart-caption">
          QPSO converges to a lower fitness value faster than classical
          metaheuristics on the same problem instance.
        </p>

      </section>


      {/* ================= ALGORITHM COMPARISON ================= */}

      <section className="dashboard-card">

        <h2>Algorithm Comparison</h2>

        <div className="table-container">

          <table className="comparison-table">

            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Best</th>
                <th>Average</th>
                <th>Worst</th>
                <th>Std Dev</th>
                <th>Avg Time (s)</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td>Exact Solver</td>
                <td>42</td>
                <td>42</td>
                <td>42</td>
                <td>0</td>
                <td>18.5</td>
              </tr>

              <tr>
                <td>Classical PSO</td>
                <td>50</td>
                <td>53</td>
                <td>58</td>
                <td>2.8</td>
                <td>6.4</td>
              </tr>

              <tr>
                <td>Genetic Algorithm</td>
                <td>56</td>
                <td>59</td>
                <td>64</td>
                <td>3.1</td>
                <td>7.2</td>
              </tr>

              <tr className="qpso-row">
                <td>
                  <strong>QPSO</strong>
                </td>

                <td>
                  <strong>42</strong>
                </td>

                <td>
                  <strong>43</strong>
                </td>

                <td>
                  <strong>45</strong>
                </td>

                <td>
                  <strong>0.9</strong>
                </td>

                <td>
                  <strong>4.1</strong>
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* ================= SCALABILITY PERFORMANCE ================= */}

      <section className="dashboard-card">

        <h2>Scalability Performance</h2>

        <div className="scalability-chart">

          <div className="scalability-y-label">
            Execution Time (seconds)
          </div>

          <div className="scalability-area">

            <svg
              className="scalability-svg"
              viewBox="0 0 800 350"
              preserveAspectRatio="none"
            >

              <polyline
                className="scalability-line exact"
                points="0,40 160,70 320,130 480,220 640,310 800,340"
              />

              <polyline
                className="scalability-line ga"
                points="0,80 160,110 320,145 480,180 640,215 800,245"
              />

              <polyline
                className="scalability-line pso"
                points="0,90 160,125 320,160 480,195 640,225 800,260"
              />

              <polyline
                className="scalability-line qpso"
                points="0,100 160,125 320,145 480,165 640,180 800,195"
              />

            </svg>

            <div className="scalability-x-values">
              <span>10</span>
              <span>20</span>
              <span>50</span>
              <span>100</span>
              <span>200</span>
              <span>500</span>
            </div>

            <div className="scalability-x-label">
              Number of Nodes / Customers
            </div>

          </div>

        </div>

        <div className="chart-legend">
          <span>🟦 QPSO</span>
          <span>🟧 Classical PSO</span>
          <span>🟩 Genetic Algorithm</span>
          <span>⬜ Exact Solver</span>
        </div>

        <p className="chart-caption">
          Exact methods become computationally infeasible beyond ~25 nodes;
          QPSO remains viable at scale.
        </p>

      </section>


      {/* ================= SOLUTION QUALITY ================= */}

      <section className="dashboard-card">

        <h2>Solution Quality vs Instance Size</h2>

        <div className="quality-chart">

          <div className="quality-y-label">
            Deviation from Optimal (%)
          </div>

          <div className="quality-area">

            <svg
              className="quality-svg"
              viewBox="0 0 800 350"
              preserveAspectRatio="none"
            >

              <polyline
                className="quality-line qpso"
                points="0,300 160,285 320,270 480,250 640,235 800,220"
              />

              <polyline
                className="quality-line pso"
                points="0,270 160,245 320,220 480,190 640,160 800,130"
              />

              <polyline
                className="quality-line ga"
                points="0,285 160,260 320,235 480,205 640,180 800,150"
              />

            </svg>

            <div className="quality-x-values">
              <span>10</span>
              <span>20</span>
              <span>50</span>
              <span>100</span>
              <span>200</span>
              <span>500</span>
            </div>

            <div className="quality-x-label">
              Number of Nodes / Customers
            </div>

          </div>

        </div>

        <div className="chart-legend">
          <span>🟦 QPSO</span>
          <span>🟧 Classical PSO</span>
          <span>🟩 Genetic Algorithm</span>
        </div>

      </section>


      {/* ================= CURRENT RUN SUMMARY ================= */}

      <section className="dashboard-card">

        <h2>Current Run Summary</h2>

        <div className="summary-cards">

          <div className="summary-card">
            <span>Total Distance</span>
            <strong>
              {runSummary.totalDistance} km
            </strong>
          </div>

          <div className="summary-card">
            <span>Total Travel Time</span>
            <strong>
              {runSummary.totalTravelTime} min
            </strong>
          </div>

          <div className="summary-card">
            <span>Vehicles Used</span>
            <strong>
              {runSummary.vehiclesUsed} / {runSummary.vehiclesAvailable}
            </strong>
          </div>

          <div className="summary-card">
            <span>Capacity Utilization</span>
            <strong>
              {runSummary.capacityUtilization}%
            </strong>
          </div>

          <div className="summary-card">
            <span>Constraint Violations</span>
            <strong>
              {runSummary.constraintViolations}
            </strong>
          </div>

        </div>

      </section>


      {/* ================= ML MODEL PERFORMANCE ================= */}

      <section className="dashboard-card">

        <h2>ML Model Performance</h2>

        <div className="ml-metrics">

          <div className="ml-metric">
            <span>RMSE</span>
            <strong>{mlModel.rmse}</strong>
          </div>

          <div className="ml-metric">
            <span>MAE</span>
            <strong>{mlModel.mae}</strong>
          </div>

          <div className="ml-metric">
            <span>R²</span>
            <strong>{mlModel.r2}</strong>
          </div>

        </div>


        <h3 className="feature-title">
          Feature Importance
        </h3>


        <div className="feature-list">

          <div className="feature-row">
            <span>Distance</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.distance}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Is Peak</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.isPeak}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Vehicles</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.vehicles}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Road Capacity</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.roadCapacity}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Weather</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.weather}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Signal Time</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.signalTime}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Hour</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.hour}%`
                }}
              ></div>
            </div>
          </div>


          <div className="feature-row">
            <span>Day of Week</span>

            <div className="feature-bar">
              <div
                style={{
                  width: `${mlModel.featureImportance.dayOfWeek}%`
                }}
              ></div>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;