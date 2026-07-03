package com.f1dashboard.backend.converter;

import com.f1dashboard.backend.model.WeatherSnapshot;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;
import java.util.List;

@Converter
public class WeatherSnapshotListConverter extends BaseJsonListConverter<WeatherSnapshot> {

    public WeatherSnapshotListConverter() {
        super(new TypeReference<List<WeatherSnapshot>>() {});
    }
}