import re

def fix_api_name_generator():
    with open('api-name-generator.js', 'r') as f:
        content = f.read()

    # We want the origin/main version of the Load Sample Logic since it uses window.SampleData.apiNameGenerator
    # But we also want the text input count updating.
    # The conflict is between:
    # <<<<<<< HEAD
    #     // Load Sample Data
    #     ... hardcoded sample ...
    # =======
    #     // --- Load Sample Logic ---
    #     ... dynamic sample logic ...
    # >>>>>>> origin/main

    # Let's just use the logic from origin/main
    conflict_pattern = re.compile(r'<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main', re.DOTALL)
    new_content = conflict_pattern.sub(r'\1', content)

    with open('api-name-generator.js', 'w') as f:
        f.write(new_content)

def fix_base64_converter():
    with open('base64-converter.html', 'r') as f:
        content = f.read()

    # We need to resolve the base64-converter conflict.
    # The conflict is about where the text area and the toggle buttons are.
    # We want the text area at the top, then the toggle buttons underneath, and the sample/char count.

    # Let's extract the whole text-mode section to rewrite it correctly.
    conflict_pattern = re.compile(r'<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main', re.DOTALL)
    # The origin/main added the text area and sample load button, BUT we want the text area *above* the toggle.

    # Actually, let's just manually replace the conflict block.
    # From HEAD:
    #                            <div class="btn-group w-100" role="group" aria-label="Text Conversion Mode">
    # ...
    #                            </div>
    # <<<<<<< HEAD
    # =======
    #
    #                            <textarea id="inputText" class="form-control glass-input flex-grow-1 p-3"
    #                                placeholder="Type or paste text here (Max 5000 chars)..."></textarea>
    #
    #                            <div class="d-flex justify-content-between mt-2">
    #                                <div>
    #                                    <button id="loadSampleBtn" class="btn btn-sm btn-outline-light text-secondary border-0 p-0" title="Load Sample Data">
    #                                        <i class="bi bi-file-earmark-text"></i> Load Sample
    #                                    </button>
    #                                </div>
    #                                <span class="text-secondary small" id="charCount">0/5000</span>
    #                            </div>
    # >>>>>>> origin/main

    # The origin/main version has the textarea and sample button below the toggle.
    # My HEAD version had the textarea and charCount *above* the toggle, and no sample button.
    # So I need to combine them: Textarea at the top, then sample button/char count, THEN toggle.

    # Let's just write the correct text-mode div.

    new_text_mode = """
                        <!-- Text Mode -->
                        <div class="tab-pane fade show active flex-grow-1 d-flex flex-column" id="text-mode"
                            role="tabpanel">
                            <label class="form-label text-secondary small fw-bold text-uppercase mb-2">Input
                                Text</label>

                            <textarea id="inputText" class="form-control glass-input flex-grow-1 p-3 mb-2"
                                placeholder="Type or paste text here (Max 5000 chars)..."></textarea>

                            <div class="d-flex justify-content-between mb-3">
                                <div>
                                    <button id="loadSampleBtn" class="btn btn-sm btn-outline-light text-secondary border-0 p-0" title="Load Sample Data">
                                        <i class="bi bi-file-earmark-text"></i> Load Sample
                                    </button>
                                </div>
                                <span class="text-secondary small" id="charCount">0/5000</span>
                            </div>

                            <!-- Encode/Decode Toggle (Segmented Control) -->
                            <div class="btn-group w-100" role="group" aria-label="Text Conversion Mode">
                                <input type="radio" class="btn-check" name="textMode" id="modeEncode" value="encode"
                                    checked>
                                <label class="btn btn-outline-light" for="modeEncode">
                                    <i class="bi bi-lock-fill mb-1 d-block d-sm-none fs-5"></i>
                                    <span class="d-none d-sm-inline"><i class="bi bi-lock-fill me-2"></i>Encode (Text
                                        &rarr; Base64)</span>
                                    <span class="d-inline d-sm-none">Encode</span>
                                </label>

                                <input type="radio" class="btn-check" name="textMode" id="modeDecode" value="decode">
                                <label class="btn btn-outline-light" for="modeDecode">
                                    <i class="bi bi-unlock-fill mb-1 d-block d-sm-none fs-5"></i>
                                    <span class="d-none d-sm-inline"><i class="bi bi-unlock-fill me-2"></i>Decode
                                        (Base64 &rarr; Text)</span>
                                    <span class="d-inline d-sm-none">Decode</span>
                                </label>
                            </div>
                        </div>"""

    # Replace the text-mode block in the file
    content = re.sub(r'<!-- Text Mode -->.*?</div>\s*</div>\s*<!-- Common Validation Alert -->', new_text_mode + '\n                    </div>\n\n                    <!-- Common Validation Alert -->', content, flags=re.DOTALL)

    with open('base64-converter.html', 'w') as f:
        f.write(content)

def fix_formula_formatter():
    with open('formula-formatter.js', 'r') as f:
        content = f.read()

    # conflict:
    # <<<<<<< HEAD
    #     // Load Sample Formula
    #     loadSampleBtn.addEventListener('click', () => {
    #         inputFormula.value = `IF(ISPICKVAL(StageName, 'Closed Won'), Amount * 0.1, IF(ISPICKVAL(StageName, 'Negotiation/Review'), Amount * 0.05, 0))`;
    #     });
    # =======
    #     // --- Load Sample Logic ---
    #     if (loadSampleBtn) {
    #         loadSampleBtn.addEventListener('click', () => {
    #             if (inputFormula.value.trim() !== '') {
    #                 const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
    #                 if (!proceed) return;
    #             }
    #
    #             inputFormula.value = window.SampleData.formulaFormatter;
    #
    #             // Trigger format
    #             formatBtn.click();
    #         });
    #     }
    # >>>>>>> origin/main

    conflict_pattern = re.compile(r'<<<<<<< HEAD.*?=======\n(.*?)\n>>>>>>> origin/main', re.DOTALL)
    new_content = conflict_pattern.sub(r'\1', content)

    with open('formula-formatter.js', 'w') as f:
        f.write(new_content)

fix_api_name_generator()
fix_base64_converter()
fix_formula_formatter()
