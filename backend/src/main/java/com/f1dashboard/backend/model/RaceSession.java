package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RaceSession {
    private String sessionName;
    private String sessionType;
    private String dateStart;
    private String dateEnd;
}