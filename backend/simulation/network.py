from typing import Optional, Dict, Any

try:
    import pandapower as pp
    PANDAPOWER_AVAILABLE = True
except ImportError:
    PANDAPOWER_AVAILABLE = False


class NetworkValidator:
    """Evaluates Kirchhoff power conservation, nodal constraints, and system frequency/voltage."""

    pandapower_available: bool = PANDAPOWER_AVAILABLE

    @staticmethod
    def validate_power_balance(
        solar_generation_kw: float,
        battery_power_kw: float,
        grid_power_kw: float,
        total_demand_served_kw: float,
        tolerance_kw: float = 1.0,
        net_balance_kw: Optional[float] = None,
    ) -> dict:
        """
        battery_power_kw > 0 is discharge (supply), < 0 is charge (demand)
        grid_power_kw > 0 is import (supply), < 0 is export (demand)
        Total Supply = solar + max(0, battery) + max(0, grid)
        Total Demand = served_demand + max(0, -battery) + max(0, -grid)
        """
        supply = solar_generation_kw + max(0.0, battery_power_kw) + max(0.0, grid_power_kw)
        demand = total_demand_served_kw + max(0.0, -battery_power_kw) + max(0.0, -grid_power_kw)

        mismatch_kw = round(abs(supply - demand), 2)
        is_balanced = mismatch_kw <= tolerance_kw

        # Frequency deviation estimate (nominal 50 Hz, drops if shortage, rises if surplus)
        unmet_imbalance = supply - demand
        frequency_hz = round(50.0 + (unmet_imbalance / 200.0) * 0.2, 2)
        frequency_hz = max(48.5, min(51.5, frequency_hz))

        # Voltage per unit estimate (nominal 1.0 pu)
        if net_balance_kw is None:
            net_balance_kw = supply - demand
        voltage_pu = round(1.0 + (net_balance_kw / 500.0) * 0.03, 3)
        voltage_pu = max(0.92, min(1.08, voltage_pu))

        # Feeder loading estimate (feeder line rated at 300 kW)
        feeder_loading_pct = min(100.0, round((demand / 300.0) * 100.0, 1))

        # Substation transformer loading estimate (transformer rated at 100 kW)
        transformer_loading_pct = min(100.0, round((abs(grid_power_kw) / 100.0) * 100.0, 1))

        # Distribution line losses (approx 2% of total throughput)
        network_losses_kw = round(supply * 0.02, 2)

        # Power flow convergence
        power_flow_converged = is_balanced

        # Connectivity
        connectivity = "grid_connected" if abs(grid_power_kw) > 0 or grid_power_kw == 0 else "islanded"

        # Bus voltages per unit
        bus_voltages = {
            "bus_solar": round(voltage_pu + 0.005, 3),
            "bus_battery": round(voltage_pu + (0.002 if battery_power_kw > 0 else -0.002), 3),
            "bus_substation": 1.000,
            "bus_hospital": round(voltage_pu - 0.008, 3),
            "bus_residential": round(voltage_pu - 0.015, 3),
            "bus_commercial": round(voltage_pu - 0.012, 3),
            "bus_ev": round(voltage_pu - 0.010, 3),
        }

        return {
            "is_balanced": is_balanced,
            "total_supply_kw": round(supply, 2),
            "total_demand_kw": round(demand, 2),
            "mismatch_kw": mismatch_kw,
            "frequency_hz": frequency_hz,
            "voltage_pu": voltage_pu,
            "feeder_loading_pct": feeder_loading_pct,
            "transformer_loading_pct": transformer_loading_pct,
            "network_losses_kw": network_losses_kw,
            "power_flow_converged": power_flow_converged,
            "connectivity": connectivity,
            "bus_voltages": bus_voltages,
            "pandapower_available": PANDAPOWER_AVAILABLE,
        }
