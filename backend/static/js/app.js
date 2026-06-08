document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.matches("form")) {
    event.preventDefault();
    alert("백엔드 저장 로직 연결 전 MVP 화면입니다.");
  }
});
