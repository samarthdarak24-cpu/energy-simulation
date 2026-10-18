class NetworkValidator:
    """Evaluates Kirchhoff power conservation, nodal constraints, and system frequency/voltage."""

    @staticmethod
    def validate_power_balance(
        solar_generation_kw: float,
        battery_power_kw: float,
        grid_power_kw: float,
        total_demand_served_kw: float,
        tolerance_kw: float = 1.0,
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
        voltage_pu = round(1.0 - (total_demand_served_kw / 500.0) * 0.05, 3)

        return {
            "is_balanced": is_balanced,
            "total_supply_kw": round(supply, 2),
            "total_demand_kw": round(demand, 2),
            "mismatch_kw": mismatch_kw,
            "frequency_hz": frequency_hz,
            "voltage_pu": voltage_pu,
        }
