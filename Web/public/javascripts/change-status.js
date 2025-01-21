document.addEventListener("DOMContentLoaded", () => {
  const changeStatusButtons = document.querySelectorAll(".btn-change-status");

  changeStatusButtons.forEach(button => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const eventId = button.getAttribute("data-event-id");
      const newStatus = button.getAttribute("data-new-status");

      const confirmChange = confirm(`Czy na pewno chcesz zmienić status wydarzenia na "${newStatus}"?`);
      if (!confirmChange) return;

      try {
        const response = await fetch(`/panel/events/${eventId}/change-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(data.message);

          location.reload();
        } else {
          const errorData = await response.json();
          alert(`Błąd: ${errorData.error || "Nie udało się zmienić statusu."}`);
        }
      } catch (error) {
        console.error("Błąd podczas zmiany statusu:", error);
        alert("Wystąpił błąd podczas zmiany statusu.");
      }
    });
  });
});
