class GridModel:
    """External electricity grid connection with capacity limits, tariffs, and carbon tracking."""

    def __init__(
        self,
        is_connected: bool = True,
        import_limit_kw: float = 100.0,
        export_limit_kw: float = 80.0,
        tariff_import_usd_kwh: float = 0.18,
        tariff_export_usd_kwh: float = 0.06,
        emissions_factor_kg_kwh: float = 0.45,
    ):
        self.is_connected = is_connected
        self.import_limit_kw = import_limit_kw
        self.export_limit_kw = export_limit_kw
        self.tariff_import_usd_kwh = tariff_import_usd_kwh
        self.tariff_export_usd_kwh = tariff_export_usd_kwh
        self.emissions_factor_kg_kwh = emissions_factor_kg_kwh

        self.current_exchange_kw = 0.0  # > 0 import, < 0 export
        self.is_faulted = False
        self.cumulative_cost_usd = 0.0
        self.cumulative_emissions_kg = 0.0

    @property
    def status(self) -> str:
        if self.is_faulted or not self.is_connected:
            return "islanded" if not self.is_faulted else "faulted"
        return "connected"

    @property
    def available_import_kw(self) -> float:
        if self.is_faulted or not self.is_connected:
            return 0.0
        return self.import_limit_kw

    @property
    def available_export_kw(self) -> float:
        if self.is_faulted or not self.is_connected:
            return 0.0
        return self.export_limit_kw

    def exchange(self, requested_kw: float, dt_hours: float) -> float:
        """
        Exchange power with the external grid.
        requested_kw > 0 => import from grid to microgrid
        requested_kw < 0 => export from microgrid to grid
        """
        if self.is_faulted or not self.is_connected:
            self.current_exchange_kw = 0.0
            return 0.0

        if requested_kw > 0:
            actual = min(requested_kw, self.import_limit_kw)
            energy_kwh = actual * dt_hours
            self.cumulative_cost_usd += energy_kwh * self.tariff_import_usd_kwh
            self.cumulative_emissions_kg += energy_kwh * self.emissions_factor_kg_kwh
        elif requested_kw < 0:
            actual = -min(abs(requested_kw), self.export_limit_kw)
            energy_kwh = abs(actual) * dt_hours
            self.cumulative_cost_usd -= energy_kwh * self.tariff_export_usd_kwh
        else:
            actual = 0.0

        self.current_exchange_kw = round(actual, 2)
        return self.current_exchange_kw
