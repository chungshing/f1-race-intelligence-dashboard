package com.f1dashboard.backend.converter;

import java.util.List;
import com.f1dashboard.backend.model.Stint;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;

@Converter
public class StintListConverter extends BaseJsonListConverter<Stint> {
    public StintListConverter() {
        super(new TypeReference<List<Stint>>() {});
    }
}