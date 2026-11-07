package br.com.femmecare.obstetrics;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Cálculos obstétricos a partir da DUM (Data da Última Menstruação).
 *
 * DPP (Data Provável do Parto): DUM + 280 dias (40 semanas).
 * Esta é a forma simplificada da regra de Naegele (+7 dias, -3 meses, +1 ano),
 * que pode diferir em um ou dois dias da regra completa conforme o mês.
 * A DPP clínica final é definida pelo médico, geralmente com base na ultrassonografia.
 */
public final class GestationalCalculator {

    /** Duração considerada da gestação em dias (40 semanas). */
    public static final int GESTATION_DAYS = 280;

    private GestationalCalculator() {
        // classe utilitária
    }

    /** Calcula a Data Provável do Parto a partir da DUM. */
    public static LocalDate expectedDueDate(LocalDate lastMenstrualPeriod) {
        Objects.requireNonNull(lastMenstrualPeriod, "DUM é obrigatória");
        return lastMenstrualPeriod.plusDays(GESTATION_DAYS);
    }

    /**
     * Calcula a idade gestacional na data informada.
     *
     * @throws IllegalArgumentException se a DUM for posterior à data de referência
     */
    public static GestationalAge gestationalAge(LocalDate lastMenstrualPeriod, LocalDate referenceDate) {
        Objects.requireNonNull(lastMenstrualPeriod, "DUM é obrigatória");
        Objects.requireNonNull(referenceDate, "data de referência é obrigatória");

        long totalDays = ChronoUnit.DAYS.between(lastMenstrualPeriod, referenceDate);
        if (totalDays < 0) {
            throw new IllegalArgumentException("A DUM não pode ser posterior à data de referência");
        }
        return new GestationalAge((int) (totalDays / 7), (int) (totalDays % 7));
    }

    /** Idade gestacional em semanas completas e dias restantes. */
    public record GestationalAge(int weeks, int days) {

        public GestationalAge {
            if (weeks < 0 || days < 0 || days > 6) {
                throw new IllegalArgumentException("Valores inválidos para idade gestacional");
            }
        }

        /** Trimestre gestacional (1, 2 ou 3), usado na escolha de exames e orientações. */
        public int trimester() {
            if (weeks < 14) {
                return 1;
            }
            if (weeks < 28) {
                return 2;
            }
            return 3;
        }

        /** Formato clínico usual, por exemplo "24s3d". */
        public String format() {
            return weeks + "s" + days + "d";
        }
    }
}
