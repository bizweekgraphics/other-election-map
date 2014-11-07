require 'json'

def election_abbrv_to_json  
  parties = []
  File.readlines('./../party_abbrev.txt').each do |line|
    line.strip!
    word_array = line.split(' ')
    abbreviation = word_array.first
    word_array.shift
    party_name = titleize(word_array.join(' '))
    party_name = "U.S. Taxpaers" if party_name == "U.s. Taxpayers" 
    parties << {name: party_name, abbreviation: abbreviation}
  end
  write_file('party_abbrev.json', {parties: parties})
end

def write_file(file_name, hash)
  File.open('./../party_abbrev.json', 'w') do |f|
    f.write(hash.to_json)
  end
end

def titleize(name)
  lowercase_words = %w{a an the and but or for nor of}
  name.split.each_with_index.map{|x, index| lowercase_words.include?(x) && index > 0 ? x : x.capitalize }.join(" ")
end

election_abbrv_to_json