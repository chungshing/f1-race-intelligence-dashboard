package com.f1dashboard.backend.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;
import java.util.List;

@Converter(autoApply = false)
public class JsonIntegerListConverter extends BaseJsonListConverter<Integer> {

    public JsonIntegerListConverter() {
        super(new TypeReference<List<Integer>>() {
        });
    }
}