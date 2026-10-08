function layout({ titulo, corpo, botaoTexto, botaoUrl, avisoExtra }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HerbWay</title>
</head>
<body style="margin:0;padding:0;font-family:'Kanit','Segoe UI',Arial,Helvetica,sans-serif;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#151d1a;border:1px solid #2b3934;border-radius:22px;">
          <tr><td align="center" style="padding:40px 32px 8px;">
            <span style="font-size:30px;font-weight:700;color:#5cc8a6;letter-spacing:-.5px;">HerbWay</span>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#e9eeeb;letter-spacing:-.3px;">${titulo}</h1>
          </td></tr>
          <tr><td style="padding:0 32px;">
            <div style="font-size:15px;line-height:1.7;color:#bdc9c3;">${corpo}</div>
          </td></tr>
          <tr><td align="center" style="padding:12px 32px 24px;">
            <a href="${botaoUrl}" target="_blank" style="display:inline-block;padding:14px 36px;background-color:#1e6b55;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:14px;">${botaoTexto}</a>
          </td></tr>
          <tr><td style="padding:0 32px 8px;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#9aa8a2;">Este link possui prazo de validade e não deve ser compartilhado.</p>
            ${avisoExtra ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#9aa8a2;">${avisoExtra}</p>` : ''}
          </td></tr>
          <tr><td style="padding:16px 32px 32px;border-top:1px solid #2b3934;">
            <p style="margin:0;font-size:13px;color:#9aa8a2;text-align:center;">HerbWay — Conectando pessoas à natureza.</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function confirmacao({ nome, url }) {
  return layout({
    titulo: 'Seja bem-vindo ao HerbWay!',
    corpo: `<p style="margin:0 0 14px;">Olá ${nome},</p><p style="margin:0 0 14px;">Estamos felizes por ter você com a gente!</p><p style="margin:0 0 14px;">Para começar a utilizar sua conta, precisamos confirmar seu endereço de e-mail.</p><p style="margin:0 0 14px;">Clique no botão abaixo para concluir o processo.</p>`,
    botaoTexto: 'CONFIRMAR MEU E-MAIL',
    botaoUrl: url,
    avisoExtra: 'Se você não criou uma conta no HerbWay, basta ignorar esta mensagem.'
  });
}

function recuperacao({ nome, url }) {
  return layout({
    titulo: 'Redefina sua senha',
    corpo: `<p style="margin:0 0 14px;">Olá ${nome},</p><p style="margin:0 0 14px;">Recebemos uma solicitação para redefinir a senha da sua conta HerbWay.</p><p style="margin:0 0 14px;">Se foi você quem solicitou, clique no botão abaixo para criar uma nova senha.</p>`,
    botaoTexto: 'REDEFINIR MINHA SENHA',
    botaoUrl: url,
    avisoExtra: 'Caso você não tenha solicitado a alteração, ignore este e-mail.'
  });
}

function textoConfirmacao({ nome, url }) {
  return `Seja bem-vindo ao HerbWay!\n\nOlá ${nome}, estamos felizes por ter você com a gente!\nPara começar, confirme seu e-mail acessando:\n${url}\n\nEste link possui prazo de validade e não deve ser compartilhado.\nSe você não criou uma conta, ignore esta mensagem.\n\nHerbWay — Conectando pessoas à natureza.`;
}

function textoRecuperacao({ nome, url }) {
  return `Redefina sua senha\n\nOlá ${nome}, recebemos uma solicitação para redefinir sua senha no HerbWay.\nSe foi você, acesse:\n${url}\n\nEste link possui prazo de validade. Caso não tenha solicitado, ignore esta mensagem.\n\nHerbWay — Conectando pessoas à natureza.`;
}

module.exports = { confirmacao, recuperacao, textoConfirmacao, textoRecuperacao };
