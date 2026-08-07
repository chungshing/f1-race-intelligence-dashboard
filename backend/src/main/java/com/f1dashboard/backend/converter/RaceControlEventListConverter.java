package com.f1dashboard.backend.converter;

import java.util.List;

import com.f1dashboard.backend.model.RaceControlEvent;
import com.fasterxml.jackson.core.type.TypeReference;

import jakarta.persistence.Converter;

@Converter
public class RaceControlEventListConverter extends BaseJsonListConverter<RaceControlEvent> {

    public RaceControlEventListConverter() {
        super(new TypeReference<List<RaceControlEvent>>() {
        });
    }
}