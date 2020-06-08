<template>
  <div class="container mt-5 mb-5">
    <div class="row pt-7 pt-sm-9">
      <div class="col-lg-8 col-sm-12">
        <h1 class="display-4 text-left mb-3 font-weight-400">Softwaretechnik</h1>

        <h4>Prof. Thomas Friedl</h4>
        </div>
      <div class="offset-lg-1 col-lg-3 col-sm-12 mt-5">
        <b-button class="btn-block" variant="success"><i class="fas fa-door-open"></i> Starten</b-button>
      </div>
    </div>
    <hr>
    <div class="row pt-7 pt-sm-9">
      <div class="col-lg-8 col-sm-12">

        <h4>Zugang für Teilnehmer</h4>
        <div class="jumbotron p-4">
          <b-button variant="light" class="float-right"><i class="fas fa-copy"></i></b-button>
          <strong>Mit PILOS teilnehmen</strong><br>
          <a href="https://11.pilos-thm.de/b/sam-er3-rwm">https://11.pilos-thm.de/b/sam-er3-rwm</a><br>
          Zugangscode: 453-532-115
        </div>
      </div>
      <div class="offset-lg-1 col-lg-3 col-sm-12 mt-5">
        <b-button v-b-toggle.collapse-1  class="btn-block"  variant="dark"><i class="fas fa-cog"></i> Einstellungen</b-button>
      </div>
    </div>
    <div class="">
      <div class="col-lg-12 col-sm-12">
        <b-collapse id="collapse-1" class="pt-4">

        <div class="card">
          <h5 class="card-header">Einstellungen</h5>
          <div class="card-body">
            <form>
              <div class="row">
                <div class="col-lg-3 col-sm-12 ">
                  <h5>Allgemein</h5>
                  <div class="form-group">
                    <label for="inputPassword4">Raumname</label>
                    <div class="input-group mb-3">
                      <input type="text" class="form-control" placeholder="" aria-label="Example text with button addon"
                             aria-describedby="button-addon1">
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="inputPassword4">Begrüßungsnachricht (max. 500 Zeichen)</label>
                    <div class="input-group mb-3">
                      <textarea type="text" class="form-control" placeholder=""
                                aria-label="Example text with button addon" aria-describedby="button-addon1"></textarea>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="inputPassword4">Max. Anzahl Teilnehmer</label>
                    <div class="input-group mb-3">
                      <input type="text" class="form-control" placeholder="unbegrenzt"
                             aria-label="Example text with button addon" aria-describedby="button-addon1">
                      <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" id="button-addon2"><i
                          class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="inputPassword4">Dauer</label>
                    <div class="input-group mb-3">
                      <input type="text" class="form-control" placeholder="unbegrenzt"
                             aria-label="Example text with button addon" aria-describedby="button-addon1">
                      <div class="input-group-append">
                        <span class="input-group-text" id="basic-addon1">min</span>
                      </div>
                      <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" id="button-addon2"><i
                          class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>


                </div>
                <div class="col-lg-3 col-sm-12 ">
                  <h5>Sicherheit</h5>
                  <div class="form-group">
                    <label for="inputPassword4">Zugangscode</label>
                    <div class="input-group mb-3">

                      <div class="input-group-prepend">
                        <button class="btn btn-outline-secondary" type="button" id="button-addon1"><i
                          class="fas fa-dice"></i></button>
                      </div>
                      <input type="text" class="form-control" placeholder="ungeschützt"
                             aria-label="Example text with button addon" aria-describedby="button-addon1">
                      <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" id="button-addon2"><i
                          class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="inputPassword4">Sicheitsstufe</label>
                    <div class="custom-control custom-radio">
                      <input type="radio" id="customRadio1" name="customRadio" class="custom-control-input">
                      <label class="custom-control-label" for="customRadio1">Öffentlich<br><small class="text-muted">Jeder
                        mit dem Link kann beitreten</small></label>
                    </div>
                    <div class="custom-control custom-radio">
                      <input type="radio" id="customRadio2" name="customRadio" class="custom-control-input">
                      <label class="custom-control-label" for="customRadio2">Intern<br><small class="text-muted">Alle
                        Nutzer</small></label>
                    </div>
                    <div class="custom-control custom-radio">
                      <input type="radio" id="customRadio3" name="customRadio" class="custom-control-input">
                      <label class="custom-control-label" for="customRadio3">Geschlossen<br><small class="text-muted">Nur
                        Teilnehmer</small></label>
                    </div>
                  </div>
                </div>
                <div class="col-lg-3 col-sm-12 ">
                  <h5>Berechtigungen</h5>
                  <div class="form-group">
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Toggle this switch element</label>
                    </div>
                  </div>


                </div>
                <div class="col-lg-3 col-sm-12 ">
                  <h5>Einschränkungen</h5>
                  <div class="form-group">
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Kamera deaktivieren</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Nur Moderatoren sehen Webcams</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Mikrofon deaktivieren</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Öffentlichen Chat deaktivieren</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Privaten Chat deaktivieren</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="customSwitch1">
                      <label class="custom-control-label" for="customSwitch1">Geteile Notizen bearbeiten</label>
                    </div>
                  </div>


                </div>
              </div>
            </form>

          </div>
        </div>
        </b-collapse>
      </div>


      <div class="col-lg-8 col-sm-12">


      </div>
    </div>
    <hr>
    <h4>Teilnehmer <span class="badge badge-pill badge-dark">126</span></h4>
    <div class="row pt-4">
      <div class="col-lg-4 col-sm-12">


        <div class="card">
          <h5 class="card-header">Einstellungen</h5>
          <div class="card-body">
            <h5 class="card-title">Special title treatment</h5>
            <p class="card-text">With supporting text below as a natural lead-in to additional
              content.</p>
            <a href="#" class="btn btn-primary">Go somewhere</a>
          </div>
        </div>
      </div>


      <div class="col-lg-8 col-sm-12">

        <table class="table table-hover">
          <thead>
          <tr>
            <th>Nachname</th>
            <th>Vorname</th>
            <th>Email</th>
            <th>Rolle</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Mark</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Larry</td>
            <td>the Bird</td>
            <td>@twitter</td>
          </tr>
          </tbody>
        </table>


      </div>
    </div>

  </div>
</template>

<script>

  export default {}
</script>
