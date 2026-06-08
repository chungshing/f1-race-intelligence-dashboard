package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RaceResult {
    private int meetingKey;
    private int sessionKey;
    private String country;

    private PodiumPosition winner;
    private PodiumPosition p2;
    private PodiumPosition p3;
}