document.addEventListener("DOMContentLoaded", () => {
    const deleteCommentLinks = document.querySelectorAll(".btn-delete-comment");
    const deleteRatingLinks = document.querySelectorAll(".btn-delete-rating");
  
    // Obsługa usuwania komentarzy
    deleteCommentLinks.forEach(link => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
  
        const eventId = link.getAttribute("data-event-id");
        const itemId = link.getAttribute("data-item-id");
        const ratingId = link.getAttribute("data-rating-id");
  
        const confirmDelete = confirm("Czy na pewno chcesz usunąć ten komentarz?");
        if (!confirmDelete) return;
  
        try {
          const response = await fetch(`/panel/events/${eventId}/items/${itemId}/reviews/${ratingId}/delete-comment`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (response.ok) {
            alert("Komentarz został pomyślnie usunięty.");
            // Usuń komentarz z widoku
            link.closest(".review-card").querySelector("p:nth-of-type(2)").innerText = "Komentarz: brak";
          } else {
            const errorData = await response.json();
            alert(`Błąd: ${errorData.error || "Nie udało się usunąć komentarza."}`);
          }
        } catch (error) {
          console.error("Błąd podczas usuwania komentarza:", error);
          alert("Wystąpił błąd podczas usuwania komentarza.");
        }
      });
    });
  
    // Obsługa usuwania ocen
    deleteRatingLinks.forEach(link => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
  
        const eventId = link.getAttribute("data-event-id");
        const itemId = link.getAttribute("data-item-id");
        const ratingId = link.getAttribute("data-rating-id");
  
        const confirmDelete = confirm("Czy na pewno chcesz usunąć tę ocenę? Ocena zostanie usunięta wraz z komentarzem.");
        if (!confirmDelete) return;
  
        try {
          const response = await fetch(`/panel/events/${eventId}/items/${itemId}/reviews/${ratingId}/delete`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          if (response.ok) {
            alert("Ocena została pomyślnie usunięta.");
            // Usuń kartę recenzji z widoku
            link.closest(".review-card").remove();
          } else {
            const errorData = await response.json();
            alert(`Błąd: ${errorData.error || "Nie udało się usunąć oceny."}`);
          }
        } catch (error) {
          console.error("Błąd podczas usuwania oceny:", error);
          alert("Wystąpił błąd podczas usuwania oceny.");
        }
      });
    });
  });
  