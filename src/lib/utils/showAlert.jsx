import Swal from "sweetalert2";
export const showAlert = (title, message) => {
    Swal.fire({
      title: `<div class='flex flex-col justify-center items-center'>
                <img src="/images/logo-completo.png" alt="Logo" style="margin-bottom: 10px;" />
              </div>`,
      html: `
        <div class='flex flex-col justify-center items-center'>
          <img src="/images/incorrectData.png" alt="Error Icon" style="border-radius: 15px;" />
          <h2 class='textos-28' style="color: white; font-size: 22px; margin-bottom: 5px;">${title}</h2>
          <p class='textos-18 text-white'>${message}</p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Try Again",
      customClass: {
        popup: "custom-popup",
        confirmButton: "custom-button",
      },
    });
  };