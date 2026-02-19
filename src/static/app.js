document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // clear dropdown options except placeholder
      activitySelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section
        let participantsMarkup = `
          <div class="participants">
            <p><strong>Participants (${details.participants.length}):</strong></p>`;
        if (details.participants.length > 0) {
          participantsMarkup += `<ul class="participants-list">${details.participants
            .map(email => `
              <li>
                <span class="participant-email">${email}</span>
                <button class="remove-participant" data-activity="${name}" data-email="${email}">&times;</button>
              </li>`)
            .join("")}</ul>`;
        } else {
          participantsMarkup += `<p><em>No one has signed up yet.</em></p>`;
        }
        participantsMarkup += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // reload activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // delegate clicks on remove buttons
  activitiesList.addEventListener("click", async (evt) => {
    if (evt.target.classList.contains("remove-participant")) {
      const activity = evt.target.dataset.activity;
      const email = evt.target.dataset.email;
      try {
        const res = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(
            email
          )}`,
          { method: "DELETE" }
        );
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.detail || "Unable to remove participant");
        }
        messageDiv.textContent = result.message;
        messageDiv.className = "info";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
        fetchActivities();
      } catch (error) {
        console.error("Error removing participant:", error);
        alert(error.message);
      }
    }
  });
});
