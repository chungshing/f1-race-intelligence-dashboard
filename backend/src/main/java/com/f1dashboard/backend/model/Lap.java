package com.f1dashboard.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.List;
import com.f1dashboard.backend.converter.JsonIntegerListConverter;

@Data
@NoArgsConstructor
@Entity
@Table(name = "laps")
public class Lap {

    @EmbeddedId
    private LapId id;

    private int meetingKey;
    private OffsetDateTime dateStart;

    private Double durationSector1;
    private Double durationSector2;
    private Double durationSector3;
    private Double lapDuration;

    private Integer i1Speed;
    private Integer i2Speed;
    private Integer stSpeed;
    private boolean isPitOutLap;

    @Convert(converter = JsonIntegerListConverter.class)
    @Column(name = "segments_sector_1", columnDefinition = "text")
    private List<Integer> segmentsSector1;

    @Convert(converter = JsonIntegerListConverter.class)
    @Column(name = "segments_sector_2", columnDefinition = "text")
    private List<Integer> segmentsSector2;

    @Convert(converter = JsonIntegerListConverter.class)
    @Column(name = "segments_sector_3", columnDefinition = "text")
    private List<Integer> segmentsSector3;

    // All-arguments constructor matching your OpenF1Service ingestion mapper
    public Lap(Integer sessionKey, Integer driverNumber, Integer lapNumber, Integer meetingKey,
            OffsetDateTime dateStart, Double durationSector1, Double durationSector2,
            Double durationSector3, Double lapDuration, Integer i1Speed, Integer i2Speed,
            Integer stSpeed, Boolean isPitOutLap, List<Integer> segmentsSector1,
            List<Integer> segmentsSector2, List<Integer> segmentsSector3) {
        this.id = new LapId(sessionKey, driverNumber, lapNumber);
        this.meetingKey = meetingKey != null ? meetingKey : 0;
        this.dateStart = dateStart;
        this.durationSector1 = durationSector1;
        this.durationSector2 = durationSector2;
        this.durationSector3 = durationSector3;
        this.lapDuration = lapDuration;
        this.i1Speed = i1Speed;
        this.i2Speed = i2Speed;
        this.stSpeed = stSpeed;
        this.isPitOutLap = isPitOutLap != null && isPitOutLap;
        this.segmentsSector1 = segmentsSector1;
        this.segmentsSector2 = segmentsSector2;
        this.segmentsSector3 = segmentsSector3;
    }
}