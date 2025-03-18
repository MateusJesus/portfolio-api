require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

const apiFilePath = path.join(__dirname, "api.json");

const readApiFile = () => JSON.parse(fs.readFileSync(apiFilePath, "utf-8"));
const writeApiFile = (data) =>
  fs.writeFileSync(apiFilePath, JSON.stringify(data, null, 2), "utf-8");

const authenticate = (req, res, next) => {
  const password = req.headers["x-api-password"];
  if (password && password === process.env.API_PASSWORD) {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Senha inválida." });
  }
};

app.put("/api-edit", authenticate, (req, res) => {
  try {
    const { id, title, shortDescription, description, website, github, image, tec, duration, featured } = req.body;
    
    let data = readApiFile();
    let projectIndex = data.projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    data.projects[projectIndex] = {
      ...data.projects[projectIndex], 
      title,
      shortDescription,
      description,
      website,
      github,
      image,
      tec: Array.isArray(tec) ? tec : [], 
      duration,
      featured: !!featured,
    };

    writeApiFile(data);

    res.json({ message: `Projeto "${title}" (ID: ${id}) atualizado com sucesso!` });
  } catch (error) {
    console.error("Erro ao editar projeto:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.delete("/api-delete", authenticate, (req, res) => {
  try {
    const { id } = req.body;
    let data = readApiFile();
    const projectIndex = data.projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    const deletedProject = data.projects.splice(projectIndex, 1); 
    writeApiFile(data);

    res.json({
      message: `Projeto "${deletedProject[0].title}" (ID: ${id}) deletado com sucesso.`,
    });
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.post("/api", (req, res) => {
  try {
    res.status(200).json({ projects: readApiFile().projects });
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.post("/api-post", authenticate, (req, res) => {
  try {
    const {
      id,
      title,
      shortDescription,
      description,
      website,
      github,
      image,
      tec,
      duration,
      featured,
      postPassword,
    } = req.body;

    if (postPassword !== process.env.POST_PROJECT) {
      return res.status(403).json({ message: "Acesso negado. Senha de post inválida." });
    }

    const project = {
      id,
      title,
      shortDescription,
      description,
      website,
      github,
      image,
      tec: Array.isArray(tec) ? tec : [],
      duration,
      featured: !!featured,
    };

    let data = readApiFile();
    data.projects.push(project);
    writeApiFile(data);

    res.status(201).json({ message: "Projeto adicionado com sucesso!", project });
  } catch (error) {
    console.error("Erro ao adicionar projeto:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
