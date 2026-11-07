package br.com.femmecare.obstetrics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class GestationalCalculatorTest {

    @Test
    void dppEhDumMaisDuzentosEOitentaDias() {
        LocalDate dum = LocalDate.of(2026, 1, 1);
        // 2026 não é bissexto: dia 1 de janeiro + 280 dias = 8 de outubro
        assertEquals(LocalDate.of(2026, 10, 8), GestationalCalculator.expectedDueDate(dum));
    }

    @Test
    void idadeGestacionalNoDiaDaDum() {
        LocalDate dum = LocalDate.of(2026, 1, 1);
        GestationalCalculator.GestationalAge ig = GestationalCalculator.gestationalAge(dum, dum);
        assertEquals(0, ig.weeks());
        assertEquals(0, ig.days());
        assertEquals("0s0d", ig.format());
    }

    @Test
    void cemDiasDepoisSaoCatorzeSemanasEDoisDias() {
        LocalDate dum = LocalDate.of(2026, 1, 1);
        // 100 = 14 * 7 + 2
        GestationalCalculator.GestationalAge ig =
                GestationalCalculator.gestationalAge(dum, dum.plusDays(100));
        assertEquals(14, ig.weeks());
        assertEquals(2, ig.days());
        assertEquals(2, ig.trimester());
    }

    @Test
    void trimestresSeguemOsLimitesDeSemanas() {
        assertEquals(1, new GestationalCalculator.GestationalAge(13, 6).trimester());
        assertEquals(2, new GestationalCalculator.GestationalAge(14, 0).trimester());
        assertEquals(2, new GestationalCalculator.GestationalAge(27, 6).trimester());
        assertEquals(3, new GestationalCalculator.GestationalAge(28, 0).trimester());
    }

    @Test
    void dumNoFuturoEhRejeitada() {
        LocalDate dum = LocalDate.of(2026, 6, 1);
        LocalDate referencia = LocalDate.of(2026, 5, 1);
        assertThrows(IllegalArgumentException.class,
                () -> GestationalCalculator.gestationalAge(dum, referencia));
    }

    @Test
    void dumNulaEhRejeitada() {
        assertThrows(NullPointerException.class,
                () -> GestationalCalculator.expectedDueDate(null));
    }
}
