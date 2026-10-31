// Endereço antigo: leva qualquer caminho para o novo.
export default {
  fetch(req) {
    const { pathname, search } = new URL(req.url);
    return Response.redirect(`https://caqui.pages.dev${pathname}${search}`, 301);
  },
};
