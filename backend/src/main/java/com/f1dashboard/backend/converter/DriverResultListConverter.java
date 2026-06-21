package com.f1dashboard.backend.converter;

import java.util.List;
import com.f1dashboard.backend.model.DriverResult;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;

@Converter
public class DriverResultListConverter extends BaseJsonListConverter<DriverResult> {
    public DriverResultListConverter() {
        super(new TypeReference<List<DriverResult>>() {});
    }
}