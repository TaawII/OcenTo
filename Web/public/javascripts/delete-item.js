document.addEventListener("DOMContentLoaded", () => {
    // Pobieramy wszystkie linki "Usuń"
    const deleteLinks = document.querySelectorAll(".btn-delete");
  
    deleteLinks.forEach(link => {
      link.addEventListener("click", async (event) => {
        event.preventDefault(); // Zapobiega domyślnemu działaniu linku
  
        const eventId = link.getAttribute("data-event-id");
        const itemId = link.getAttribute("data-item-id");
  
        // Potwierdzenie usunięcia
        const confirmDelete = confirm("Czy na pewno chcesz usunąć ten przedmiot?");
        if (!confirmDelete) return;
  
        try {
          const response = await fetch(`/panel/events/${eventId}/items/${itemId}/delete`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (response.ok) {
            alert("Przedmiot został pomyślnie usunięty.");
            // Usuń kartę itemu z widoku
            link.closest(".item-card").remove();
          } else {
            const errorData = await response.json();
            alert(`Błąd: ${errorData.error || "Nie udało się usunąć przedmiotu."}`);
          }
        } catch (error) {
          console.error("Błąd podczas usuwania przedmiotu:", error);
          alert("Wystąpił błąd podczas usuwania przedmiotu.");
        }
      });
    });
  });
  