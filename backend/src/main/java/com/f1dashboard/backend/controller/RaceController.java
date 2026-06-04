package com.f1dashboard.backend.controller;

import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.service.OpenF1Service;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@CrossOrigin(origins = "*")
public class RaceController {

    private final OpenF1Service openF1Service;

    public RaceController(OpenF1Service openF1Service) {
        this.openF1Service = openF1Service;
    }

    @GetMapping("/weekends")
    public List<RaceWeekend> getRaceWeekends(
            @RequestParam(defaultValue = "2026") int year) {
        return openF1Service.fetchRaceWeekends(year);
    }
}