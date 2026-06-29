package com.f1dashboard.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class OpenF1LapDto {
    private Integer session_key;
    private Integer driver_number;
    private Integer lap_number;
    private Integer meeting_key;
    private String date_start;
    private Double duration_sector_1;
    private Double duration_sector_2;
    private Double duration_sector_3;
    private Double lap_duration;
    private Integer i1_speed;
    private Integer i2_speed;
    private Integer st_speed;
    private Boolean is_pit_out_lap;
    private List<Integer> segments_sector_1;
    private List<Integer> segments_sector_2;
    private List<Integer> segments_sector_3;
}