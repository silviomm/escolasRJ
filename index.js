//configurando o express
var express = require('express');
var app = express();
app.use(express.static('public'));
//configurando body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
//configurando express-handlebars
var exphbs = require('express-handlebars');
var hbs = exphbs.create({
    helpers: {
        foo: function() {
            return 'FOO!';
        },
        bar: function() {
            return 'BAR!';
        }
    }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

//configurando BD mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'teste'
});
connection.connect();
connection.query("SET GLOBAL sql_mode = '';", function(error){
  if (error != null) {
      if (error.code == 'PROTOCOL_CONNECTION_LOST')
          handleDisconnect();
      else
          console.log(error);
  }
  else{
    console.log("foi")
  }
})

app.get('/', function(req, res, next) {
    res.render('home', {
        home: true,
        teste: 'ola',
        // Override `foo` helper only for this rendering.
        helpers: {
            teste: function() {
                return 'kkkkkkkk';
            }
        }
    });
});


app.listen(3000, function() {
    console.log("rodando na porta 3000");
});


//------------------------------------------------------------------------------
/*
    A PARTIR DAQUI, FICA GET/POST DE CADA QUERY
*/
//------------------------------------------------------------------------------

//ESCOLA NO SEU BAIRRO
app.get('/escolaBairro', function(req, res, next){
  res.render('home', {
    escolaBairro : true,
    helpers:{
      mapa: function(){
        return 'aqui vai ficar o mapa';
      }
    }
  })
});
app.post('/escolaBairro', function(req, res, next) {
  console.log(req.body.nomeBairro);

  var query = 'SELECT nome, latitude, longitude ';
  query = query + 'from escola natural join endereco ';
  query = query + 'where endereco.bairro_nome = \"' + req.body.nomeBairro + '\";';

  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    if(rows.length != 0){
      res.render('home', {
          escolaBairro: true,
          mapa: true,
          escolas: rows,
          latPrincipal: rows[0].latitude,
          longPrincipal: rows[0].longitude
      });
    }
    else{
      res.render('home', {
          escolaBairro: true,
          mapa: false,
          semEscola: true
      });
    }
  });
});


app.get('/disciplinasDaEscola', function(req, res, next){
  res.render('home', {
    disciplinasDaEscola : true
  })
});
app.post('/disciplinasDaEscola', function(req, res, next) {
  console.log(req.body.nomeEscola);

  var query = 'select disciplina.nome ';
  query = query + 'from escola natural join ensina join disciplina on ensina.id_disciplina = disciplina.codigo ';
  query = query + 'where quant_professor != 0 and escola.nome = \"' + req.body.nomeEscola + '\";';

  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    if(rows.length != 0){
      res.render('home', {
          disciplinasDaEscola: true,
          disciplinas: rows,
          temDisciplinas: true
      });
    }
    else{
      res.render('home', {
          disciplinasDaEscola: true,
          temDisciplinas: false,
          naoTem: true
      });
    }
  });
});





app.get('/escolasAcimaDoIdeb', function(req, res, next){

  var query = "select endereco.bairro_nome, b.nome ";
  query = query + "from endereco natural join (select escola.end_id, escola.nome from escola where escola.ideb_1 "
  query = query + ">(select avg(escola.ideb_1) from escola) and escola.ideb_2 >(select avg(escola.ideb_1) from escola)) as b;";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    res.render('home', {
          escolasAcimaDoIdeb: true,
          escolas: rows
      });
  });
});


app.get('/qntdDeEscolasPorBairro', function(req, res, next){
  res.render('home', {
    qntdDeEscolasPorBairro : true
  })
});
app.post('/qntdDeEscolasPorBairro', function(req, res, next){

  console.log(req.body.qntd);

  var query = "select bairro_nome,count(*) as qntd "
  query = query +"from escola inner join endereco on escola.end_id = endereco.end_id ";
  query = query +"where bairro_nome is not null "
  query = query +"group by (bairro_nome) "
  query = query +"order by (qntd) desc;"

  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    var bairros = [];
    var qntds = [];
    var aux = req.body.qntd;
    if(aux > rows.length) aux = rows.length;

    for(var i=0;i<aux;i++){
      bairros.push(rows[i].bairro_nome);
      qntds.push(rows[i].qntd);
    }
    res.render('home', {
          qntdDeEscolasPorBairro: true,
          bairros: bairros,
          qntds: qntds,
          grafico: true,
          qntd: aux
      });
  });
});



app.get('/bairrosComMaisMenos', function(req, res, next){


  var query = "select nome, max(num_alunos) as qntd ";
  query = query +"from bairro "
  query = query + "where num_alunos = (select max(num_alunos) from bairro ) ";
  query = query +"union ";
  query = query +"select nome, min(num_alunos) ";
  query = query +"from bairro ";
  query = query +"where num_alunos = (select min(num_alunos) from bairro );";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    var bairros = [];
    var qntds = [];
    for(var i=0;i<rows.length;i++){
      bairros.push(rows[i].bairro_nome);
      qntds.push(rows[i].qntd)
    }
    res.render('home', {
          bairrosComMaisMenos: true,
          bairros: bairros,
          qntds: qntds
      });
  });
});


app.get('/bairrosComBrtTrem', function(req, res, next){

  var query = "SELECT distinct bairro.nome ";
  query = query + "FROM brt inner join bairro on brt.bairro_nome = bairro.nome and brt.bairro_nome in( ";
  query = query + "SELECT bairro.nome ";
  query = query + "FROM trem inner join bairro on trem.bairro_nome = bairro.nome);";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    res.render('home', {
          bairrosComBrtTrem: true,
          bairros: rows
      });
  });
});




app.get('/brtNaEscola', function(req, res, next){
  res.render('home', {
    brtNaEscola : true
  })
});
app.post('/brtNaEscola', function(req, res, next) {
  console.log(req.body.nomeEscola);

  var query = "select distinct escola.nome as escola, brt.linha as linha, bairro.nome as nomeBairro, brt.nome as estacao ";
  query = query + "from escola natural join endereco inner join bairro on endereco.bairro_nome = bairro.nome ";
  query = query + "inner join brt on bairro.nome = brt.bairro_nome ";
  query = query + "where escola.nome = \""+req.body.nomeEscola+"\" ";
  query = query + "order by escola.nome;";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    if(rows.length == 0){
      res.render('home', {
          brtNaEscola: true,
          semBrt: true
      });
    }
    else{
      res.render('home', {
          brtNaEscola: true,
          comBrt: true,
          nomeEscola: req.body.nomeEscola,
          nomeBairro: rows[0].nomeBairro,
          estacoes: rows
      });
    }
  });
});


app.get('/qntdDeAlunosPorBairro', function(req, res, next){
  res.render('home', {
    qntdDeAlunosPorBairro : true
  })
});
app.post('/qntdDeAlunosPorBairro', function(req, res, next){

  console.log(req.body.qntd);

  var query = "select nome,num_alunos ";
  query = query + "from bairro ";
  query = query + "where num_alunos > 0 ";
  query = query + "order by num_alunos desc;";

  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    var bairros = [];
    var qntds = [];
    var aux = req.body.qntd;
    if(aux > rows.length) aux = rows.length;

    for(var i=0;i<aux;i++){
      bairros.push(rows[i].nome);
      qntds.push(rows[i].num_alunos)
    }
    res.render('home', {
          qntdDeAlunosPorBairro: true,
          bairros: bairros,
          qntds: qntds,
          grafico: true,
          qntd: aux
      });
  });
});


app.get('/escolasSemTelefone', function(req, res, next){

  var query = "select nome ";
  query = query + "from escola left join telefone on (escola.designacao = telefone.esc_designacao) ";
  query = query + "where numero is null;";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    res.render('home', {
          escolasSemTelefone: true,
          escolas:
           rows
      });
  });
});




app.get('/transporteNaEscola', function(req, res, next){
  res.render('home', {
    transporteNaEscola : true
  })
});


app.post('/transporteNaEscola', function(req, res, next) {
  console.log(req.body.nomeEscola);

  var query = "select escola.nome AS escola, bairro.nome as bairro, metro.nome as metro, "
  query = query + "endereco.latitude as e_latitude, endereco.longitude as e_longitude, "
  query = query + "metro.latitude as m_latitude, metro.longitude as m_longitude, trem.nome as trem, "
  query = query + "trem.latitude as t_latitude, trem.longitude as t_longitude, brt.nome as brt, "
  query = query + "brt.latitude as b_latitude, brt.longitude as b_longitude ";
  query = query + "from escola natural join endereco ";
  query = query + "inner join bairro on endereco.bairro_nome = bairro.nome ";
  query = query + "left join metro on bairro.nome =  metro.bairro_nome "
  query = query + "left join trem on bairro.nome = trem.bairro_nome "
  query = query + "left join brt on bairro.nome = brt.bairro_nome "
  query = query + "where bairro.nome != \'centro\' and escola.nome =\""+req.body.nomeEscola+"\";";


  connection.query(query, function(error, rows, fields) {
    if (error != null) {
        if (error.code == 'PROTOCOL_CONNECTION_LOST')
            handleDisconnect();
        else
            console.log(error);
    }
    if(rows.length == 0){
      res.render('home', {
          transporteNaEscola: true,
          semT: true
      });
    }
    else{

      var brts = [], metros = [], trens = [];
      for(var i=0;i<rows.length;i++){
        if(rows[i].brt != null){
          if(brts.length != 0){
            if(rows[i].brt != brts[brts.length-1].nome){
              brts.push({nome: rows[i].brt,
                          latitude: rows[i].b_latitude,
                          longitude: rows[i].b_longitude
                        });
            }
          }else{
          brts.push({nome: rows[i].brt,
                      latitude: rows[i].b_latitude,
                      longitude: rows[i].b_longitude
                    });
        }}
        if(rows[i].metro != null){
          if(metros.length != 0){
            if(rows[i].metro != metros[metros.length-1].nome){
              metros.push({nome: rows[i].metros,
                          latitude: rows[i].m_latitude,
                          longitude: rows[i].m_longitude
                        });
            }
          }else{
          metros.push({nome: rows[i].metro,
                      latitude: rows[i].m_latitude,
                      longitude: rows[i].m_longitude
                    });
        }}
        if(rows[i].trem != null){
          if(trens.length != 0){
            if(rows[i].trem != trens[trens.length-1].nome){
              trens.push({nome: rows[i].trem,
                          latitude: rows[i].t_latitude,
                          longitude: rows[i].t_longitude
                        });
            }
          }else{
          trens.push({nome: rows[i].trem,
                      latitude: rows[i].t_latitude,
                      longitude: rows[i].t_longitude
                    });
        }}
      }

      console.log(trens.length);

            console.log(brts.length);
                  console.log(metros.length);
      var comBrts = false, comMetros = false, comTrens = false;
      if(brts.length > 0) comBrts = true
      if(metros.length > 0) comMetros = true
      if(trens.length > 0) comTrens = true

      var comT = true;
      var semT = false;
      if(brts.length == 0 && trens.length == 0 && metros.length ==0) {comT = false; semT = true}

      res.render('home', {
          transporteNaEscola: true,
          comT: comT,
          semT: semT,
          nomeEscola: req.body.nomeEscola,
          nomeBairro: rows[0].bairro,
          brts: brts,
          trens: trens,
          metros: metros,
          comTrens: comTrens,
          comBrts: comBrts,
          comMetros: comMetros,
          latEscola: rows[0].e_latitude,
          longEscola: rows[0].e_longitude
      });
    }
  });
});
