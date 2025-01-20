document.addEventListener("DOMContentLoaded", () => {
    // Pobierz wszystkie linki "Usuń"
    const deleteLinks = document.querySelectorAll(".btn-delete");
  
    deleteLinks.forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault(); // Zapobiega domyślnemu działaniu linku
  
        const eventId = link.getAttribute("data-event-id");
  
        // Potwierdzenie usunięcia
        const confirmDelete = confirm(
          "Czy na pewno chcesz usunąć to wydarzenie? Wszystkie przedmioty i oceny zostaną usunięte."
        );
        if (!confirmDelete) return;
  
        try {
          const response = await fetch(`/panel/events/${eventId}/delete`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (response.ok) {
            alert("Wydarzenie zostało pomyślnie usunięte.");
            // Usuń wiersz tabeli z widoku
            link.closest("tr").remove();
          } else {
            const errorData = await response.json();
            alert(`Błąd: ${errorData.error || "Nie udało się usunąć wydarzenia."}`);
          }
        } catch (error) {
          console.error("Błąd podczas usuwania wydarzenia:", error);
          alert("Wystąpił błąd podczas usuwania wydarzenia.");
        }
      });
    });
  });
  