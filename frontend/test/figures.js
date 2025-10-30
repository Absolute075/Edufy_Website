const figure = document.getElementById("figure");
const inputs = document.querySelectorAll(".input");

// Следит за курсором
document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    figure.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
});

// Реакция на поля
inputs.forEach((input) => {
    input.addEventListener("focus", () => {
        if (input.id === "email") figure.style.transform = "rotateY(-10deg)";
        if (input.id === "password") figure.style.transform = "rotateY(10deg)";
    });

    input.addEventListener("blur", () => {
        figure.style.transform = "rotateY(0deg)";
    });
});
