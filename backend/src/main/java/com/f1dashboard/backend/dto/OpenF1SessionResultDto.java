package com.f1dashboard.backend.dto;

import com.fasterxml.jackson.annotation.JsonSetter;

import lombok.AccessLevel;
import lombok.Data;
import lombok.Setter;

@Data
public class OpenF1SessionResultDto {
    private Boolean dnf;
    private Boolean dns;
    private Boolean dsq;

    private Integer driver_number;
    private Object duration;
    private Object gap_to_leader;

    private Integer number_of_laps;
    private Integer meeting_key;
    @Setter(AccessLevel.NONE)
    private Integer position;
    private Integer session_key;

    // OpenF1 sometimes sends text here ("RT", etc.) for drivers without a
    // classified position.
    @JsonSetter("position")
    public void setPositionLenient(Object raw) {
        if (raw instanceof Number n) {
            this.position = n.intValue();
        } else if (raw instanceof String s) {
            try {
                this.position = Integer.valueOf(s.trim());
            } catch (NumberFormatException e) {
                this.position = null;
            }
        } else {
            this.position = null;
        }
    }
}